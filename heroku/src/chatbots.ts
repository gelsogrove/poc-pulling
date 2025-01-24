import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import {
  cleanResponse,
  executeSqlQuery,
  getPrompt,
} from "./chatbots_utility.js"
import { validateRequest } from "./validateUser.js"

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
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    const status = error.response?.status ?? 0
    return error.code === "ECONNRESET" || status >= 500
  },
})

const handleResponse: RequestHandler = async (req, res) => {
  try {
    console.log("Received request:", req.body) // Log del payload ricevuto

    const { userId, token } = await validateRequest(req, res)
    if (!userId || !token) {
      console.log("Validation failed for token or userId.") // Log in caso di fallimento validazione
      res.status(200).json({
        message: "Authentication issue",
      })
      return
    }

    console.log("User validated:", { userId })

    const { conversationId, idPrompt, messages } = req.body

    if (!conversationId || !Array.isArray(messages)) {
      console.log("Validation failed for conversationId or messages.") // Log input non valido
      res.status(400).json({
        message: "conversationId and messages array are required.",
      })
      return
    }

    console.log("Validation passed, preparing to fetch prompt...")

    // Recupera prompt
    const promptResult = await getPrompt(idPrompt)
    console.log("Fetched prompt:", promptResult) // Log dei dettagli del prompt

    const { prompt, model, temperature } = promptResult

    // Simula la storia della conversazione
    const conversationHistory = messages.map((msg) => ({
      role: msg.role || "user",
      content: msg.content,
    }))

    console.log("Conversation history length:", conversationHistory.length)

    // Payload per OpenRouter
    const requestPayload = {
      model,
      messages: [
        { role: "system", content: prompt },
        ...conversationHistory,
        { role: "system", content: `Language: eng` },
      ],
      max_tokens: MAX_TOKENS,
      temperature: Number(temperature),
    }

    console.log("Request payload for OpenRouter:", requestPayload)

    // Chiamata a OpenRouter
    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    console.log("OpenRouter response:", openaiResponse.data) // Log risposta OpenRouter

    if (openaiResponse.data.error) {
      console.log("Error in OpenRouter response:", openaiResponse.data.error)
      res.status(500).json({ response: openaiResponse.data.error.message })
      return
    }

    // Parsing della risposta
    const rawResponse = cleanResponse(
      openaiResponse.data.choices[0]?.message?.content
    )
    console.log("Raw response:", rawResponse)

    let parsedResponse
    try {
      parsedResponse = JSON.parse(rawResponse)
      console.log("Parsed response:", parsedResponse)
    } catch (error) {
      console.error("Failed to parse OpenAI response:", rawResponse, error)
      res.status(500).json({ response: "Invalid response from OpenRouter" })
      return
    }

    // Gestione risposta
    const sqlQuery = parsedResponse.sql || null
    const finalResponse = parsedResponse.response || "No response provided."
    const triggerAction = parsedResponse.triggerAction || ""

    if (sqlQuery) {
      console.log("Executing SQL query:", sqlQuery) // Log della query SQL
      const sqlData = await executeSqlQuery(sqlQuery)
      console.log("SQL query executed successfully.")
      res.status(200).json({
        triggerAction,
        response: finalResponse,
        data: sqlData,
        query: sqlQuery,
      })
      return
    }

    res.status(200).json({
      triggerAction,
      response: finalResponse,
    })
  } catch (error) {
    console.error("Unhandled error in handleResponse:", error) // Log degli errori non gestiti
    res.status(500).json({ response: "Internal server error" })
  }
}

chatbotRouter.post("/response", handleResponse)
export default chatbotRouter
