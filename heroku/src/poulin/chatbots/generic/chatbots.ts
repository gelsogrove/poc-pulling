import axios from "axios"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"

import { GetAndSetHistory } from "../../share/history.js"
import { validateRequest } from "../../share/validateUser.js"
import { getPrompt } from "../../utility/chatbots_utility.js"

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

const handleResponse: RequestHandler = async (req: Request, res: Response) => {
  console.log("\n📥 *** CHATBOT Generic ***")

  // Validazione utente
  const { userId } = await validateRequest(req, res)
  console.log(" - UserId:", userId)
  if (!userId) return

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

  // Prepara il payload per il modello
  const requestPayload = {
    model,
    messages: [
      { role: "system", content: "Language: it" },
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

  if (!openaiResponse.data?.choices?.length) {
    console.log("❌ OpenRouter response missing choices array")
    res.status(200).json({
      id: conversationId,
      sender: "bot",
      error: "No response from OpenRouter",
      debug: openaiResponse.data, // Aggiungiamo i dati grezzi per debug
    })
    return
  }

  console.log(
    "\n📩 OPENROUTER RECEIVED:",
    JSON.stringify(openaiResponse.data.choices[0]?.message?.content, null, 2)
  )

  // Gestisce errori nella risposta API
  if (openaiResponse.data.error) {
    res.status(200).json({
      response: "Empty response from OpenRouter",
      error: openaiResponse.data.error.message,
    })
    return
  }

  try {
    // Pulisce e valida il contenuto della risposta
    const rawResponse = openaiResponse.data.choices[0]?.message?.content
    if (!rawResponse) {
      res.status(200).json({
        response: "Empty response from OpenRouter",
        rawResponse,
      })
      return
    }

    const parsedResponse = JSON.parse(rawResponse)
    const botResponse = {
      role: "assistant",
      content: parsedResponse.response || "Nessuna risposta",
    }

    // Risposta al frontend
    res.status(200).json({
      response: "reponse from the sub-bot",
      text: {
        conversationId,
        target: parsedResponse.target,
        triggerAction: "todo",
        response: botResponse,
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
