import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"

// Importazione delle funzioni utilitarie dal modulo chatbot_utility
import {
  detectLanguage,
  executeSqlQuery,
  getPrompt,
  handleError,
  validateToken,
} from "./chatbots_utility.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 5000
const chatbotRouter = Router()

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    console.log(`Retry attempt: ${retryCount}`)
    return retryCount * 1000
  },
  retryCondition: (error) => {
    const status = error.response?.status ?? 0
    return error.code === "ECONNRESET" || status >= 500
  },
})

const handleChat: RequestHandler = async (req, res): Promise<void> => {
  const { conversationId, token, messages } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    // Validazione del token utente utilizzando la funzione spostata
    const userId = await validateToken(token)
    if (!userId) {
      res.status(403).json({ message: "Invalid token." })
      return
    }

    const userMessage = messages[messages.length - 1]?.content
    if (!userMessage) {
      res.status(400).json({ message: "No user message provided." })
      return
    }

    const detectedLanguage = await detectLanguage(userMessage)

    const promptResult = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!promptResult) {
      throw new Error("Prompt non trovato")
    }

    const { prompt, model, temperature } = promptResult
    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()

    const requestPayload = {
      model,
      messages: [
        { role: "system", content: truncatedPrompt },
        { role: "user", content: userMessage },
        { role: "system", content: `Language: ${detectedLanguage}` },
      ],
      max_tokens: MAX_TOKENS,
      temperature,
    }

    console.log("Request Payload:", requestPayload)

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    const choices = openaiResponse.data.choices
    if (!choices || choices.length === 0) {
      res.status(204).json({ message: "No choices returned from OpenRouter" })
      return
    }

    const rawResponse = choices[0]?.message?.content
    if (!rawResponse) {
      res.status(204).json({ message: "Empty response from OpenRouter" })
      return
    }

    console.log("Raw OpenRouter Response:", rawResponse)

    let sqlQuery: string | null = null
    let finalResponse: string = ""
    let triggerAction: string = ""
    try {
      const parsedResponse = JSON.parse(rawResponse)
      sqlQuery = parsedResponse.sql || null
      finalResponse = parsedResponse.response || "No response provided."
      triggerAction = parsedResponse.triggerAction || ""
    } catch (parseError) {
      console.error("Error parsing OpenRouter response:", parseError)
      res.status(500).json({
        message: "Invalid response format from OpenRouter",
      })
      return
    }

    if (!sqlQuery) {
      console.log("No SQL query provided. Sending response only.")
      res.status(200).json({
        triggerAction,
        response: finalResponse,
      })
      return
    }

    console.log("Executing SQL Query:", sqlQuery)
    // Utilizza la funzione executeSqlQuery da chatbot_utility per eseguire la query SQL
    const sqlData = await executeSqlQuery(sqlQuery)

    console.log("SQL Query Result:", sqlData)

    res.status(200).json({
      triggerAction,
      response: finalResponse,
      data: sqlData,
    })
  } catch (error) {
    console.error("Error in handleChat:", error)
    // Utilizza la funzione handleError spostata
    const errorResponse = handleError(error)
    res.status(500).json(errorResponse)
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
