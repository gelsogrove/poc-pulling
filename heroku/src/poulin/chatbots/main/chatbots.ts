import axios from "axios"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"

import { GetAndSetHistory } from "../../share/history.js"
import { validateRequest } from "../../share/validateUser.js"
import { getPrompt, sendUsageData } from "../../utility/chatbots_utility.js"
import { getLLMResponse } from "../getLLMresponse.js"

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

// Verifica che la chiave API sia configurata
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

// Definisci un tipo per i target
type Target = "Generic" | "Products" | "Order" | "Logistic"

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
  const { prompt, model, temperature } = await getPrompt(idPrompt)

  // Gestisce la history della conversazione
  const updatedHistory = await GetAndSetHistory(
    conversationId,
    idPrompt,
    userId,
    new Date(),
    message,
    "" // La prima volta sarà vuota, poi verrà recuperata dal DB
  )
  console.log("updatedHistory 1", updatedHistory)
  console.log("message 1", message)

  // Prepara il payload per il modello
  const requestPayload = {
    model,
    messages: [
      { role: "system", content: "Language: it" },
      { role: "system", content: "Language: es" },
      { role: "system", content: "Language: en" },
      { role: "system", content: prompt },
      ...updatedHistory,
      message,
    ],
    max_tokens: MAX_TOKENS,
    temperature: Number(temperature),
    response_format: { type: "json_object" },
  }

  // Invia richiesta a OpenRouter
  const openaiResponse = await axios.post(OPENROUTER_API_URL, requestPayload, {
    headers: OPENROUTER_HEADERS,
    timeout: 30000,
  })

  try {
    // Pulisce e valida il contenuto della risposta
    const rawResponse = openaiResponse.data.choices[0]?.message?.content
    const parsedResponse = JSON.parse(rawResponse)

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
    let response: string

    const targetMap = {
      Generic: {
        id: "7e963d5d-ce8d-45ac-b3da-0d9642d580a8",
        chatbot: "Generic",
      },
      Products: {
        id: "94624adb-6c09-44c3-bda5-1414d40f04f3",
        chatbot: "Products",
      },
      Order: {
        id: "a2a55acd-9db1-4ef3-a3f1-b745b7c0eaad",
        chatbot: "Order",
      },
      Logistic: {
        id: "5abf1bd8-3ab1-4f8a-901c-a064cf18955c",
        chatbot: "Logistic",
      },
    }

    if (targetMap[parsedResponse.target as Target]) {
      const { id, chatbot } = targetMap[parsedResponse.target as Target]
      const { user, content } = await getLLMResponse(
        id,
        updatedHistory,
        chatbot
      )
      response = content
      updatedHistory.push({ role: user, content, chatbot })
    } else {
      response = "Target non riconosciuto."
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
      response,
      text: {
        conversationId,
        target: parsedResponse.target,
        trigger_action: parsedResponse.trigger_action,
        history: updatedHistory,
      },
    })
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

export default chatbotMainRouter
