import axios from "axios"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"

import {
  GetAndSetHistory,
  updateConversationHistory,
} from "../../share/history.js"
import { validateRequest } from "../../share/validateUser.js"
import {
  getCoordinatorResponse,
  getPrompt,
  getTargetConfig,
  prepareFinalPayload,
  sendUsageData,
  Target,
} from "../../utility/chatbots_utility.js"
import { getLLMResponse } from "./getLLMresponse.js"

dotenv.config()

/**
 * Configurazione per le chiamate a OpenRouter
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 5000

const chatbotMainRouter = Router()

// Cache per i prompt degli specialisti
const specialistPromptsCache: {
  [key: string]: { prompt: string; model: string; temperature: number }
} = {}

/**
 * Gestisce le richieste di chat al chatbot
 *
 * Il flusso è:
 * 1. Verifica autenticazione e autorizzazione
 * 2. Recupera e aggiorna la history della conversazione
 * 3. Invia la richiesta al modello
 * 4. Processa e restituisce la risposta
 */
const handleResponse: RequestHandler = async (req: Request, res: Response) => {
  // Validazione utente
  const { userId } = await validateRequest(req, res)
  console.log(" - UserId:", userId)
  if (!userId) return

  // Recupera GET DATA FROM BODY
  const { conversationId, idPrompt, message } = req.body

  // Recupera configurazione del prompt
  const promptData = await getPrompt(idPrompt)
  if (!promptData) {
    throw new Error(`Prompt not found for ID: ${idPrompt}`)
  }

  // Gestisce la history della conversazione
  let updatedHistory = await GetAndSetHistory(
    conversationId,
    idPrompt,
    userId,
    new Date(),
    message,
    "" // La prima volta sarà vuota, poi verrà recuperata dal DB
  )

  // Ottieni la risposta dal modello
  const response = await getLLMResponse(message, promptData, updatedHistory)

  try {
    // Pulisce e valida il contenuto della risposta
    const parsedResponse = JSON.parse(response.content)

    if (parsedResponse.trigger_action) {
      const day = new Date().toISOString().split("T")[0]
      await sendUsageData(
        day,
        0.2,
        "main",
        parsedResponse.trigger_action,
        userId,
        idPrompt
      )
    }

    // Risposta al frontend
    let finalResponse: string

    if (parsedResponse.target) {
      const targetConfig = getTargetConfig(parsedResponse.target as Target)
      if (targetConfig) {
        const { id, chatbot } = targetConfig

        const specialistResponse = await fetchSpecialistResponse(
          id,
          updatedHistory,
          chatbot
        )
        const finalPayload = prepareFinalPayload(
          message,
          chatbot,
          specialistResponse.content
        )
        finalResponse = await getCoordinatorResponse(finalPayload)
        updatedHistory = updateConversationHistory(
          updatedHistory,
          chatbot,
          specialistResponse.content,
          finalResponse,
          specialistResponse.user,
          parsedResponse.trigger_action
        )
      } else {
        finalResponse = "Target non riconosciuto."
      }
    } else {
      finalResponse = "Target non specificato."
    }

    // Salva la risposta del bot nel DB prima di inviarla al frontend
    await GetAndSetHistory(
      conversationId,
      idPrompt,
      userId,
      new Date(),
      updatedHistory[updatedHistory.length - 1],
      ""
    )

    // Invio al frontend
    res.status(200).json({
      response: finalResponse,
      text: {
        conversationId,
        target: parsedResponse.target,
        trigger_action: parsedResponse.trigger_action,
        history: updatedHistory,
      },
    })

    // Invia un messaggio a WhatsApp se necessario
    await sendToWhatsapp(finalResponse, req)
  } catch (parseError) {
    res.status(200).json({
      id: conversationId,
      sender: "bot",
      error: "Failed to parse response",
    })
  }
}

// Registra l'handler per le richieste POST
chatbotMainRouter.post("/response", handleResponse)

/**
 * Ottiene la risposta dallo specialista, caricando il prompt solo la prima volta
 */
export async function fetchSpecialistResponse(
  id: string,
  updatedHistory: any[],
  chatbot: string
) {
  // Carica il prompt solo se non è in cache
  if (!specialistPromptsCache[id]) {
    const promptData = await getPrompt(id)
    if (promptData) {
      specialistPromptsCache[id] = promptData
    }
  }

  // Usa il prompt dalla cache
  const promptData = specialistPromptsCache[id]
  if (!promptData) {
    throw new Error(`Prompt non trovato per l'ID ${id}`)
  }

  return await getLLMResponse("", promptData, updatedHistory)
}

/**
 * Invia un messaggio a WhatsApp se necessario
 * @param response Risposta da inviare
 * @param req Richiesta originale
 */
const sendToWhatsapp = async (response: string, req: Request) => {
  // Controlla se la richiesta proviene da WhatsApp
  const whatsappNumber = req.body.whatsappNumber

  if (whatsappNumber) {
    try {
      // Usa il server locale sulla stessa porta
      await axios.post(
        `http://localhost:${process.env.PORT || 4999}/whatsapp/send`,
        {
          to: whatsappNumber,
          message: response,
        }
      )
      console.log(`Risposta inviata a WhatsApp: ${whatsappNumber}`)
    } catch (error) {
      console.error(`Errore nell'invio a WhatsApp (${whatsappNumber}):`, error)
    }
  }
}

export default chatbotMainRouter
