// File: src/chatbots.ts (o dove si trova il tuo router)
import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import {
  detectLanguage,
  fetchInitialStatistics,
  getPrompt,
  handleError,
  validateToken,
} from "./chatbots_utility.js" // Aggiorna il percorso in base alla tua struttura

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

const MAX_TOKENS = 5000
const chatbotRouter = Router()

/**
 * Handler per l'endpoint POST /response
 */
const handleChat: RequestHandler = async (req, res): Promise<void> => {
  const { conversationId, token, messages } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    const userId = await validateToken(token, res)
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

    const promptData = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!promptData) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }
    const { prompt, model } = promptData
    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()

    const requestPayload = {
      model: model,
      messages: [
        { role: "system", content: truncatedPrompt },
        { role: "user", content: userMessage },
        { role: "system", content: `Language: ${detectedLanguage}` },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
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

    const rawResponse = openaiResponse.data.choices[0]?.message?.content
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
    const sqlApiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(
      sqlQuery
    )}`
    const sqlResult = await axios.get(sqlApiUrl)

    console.log("SQL Query Result:", sqlResult.data)

    res.status(200).json({
      triggerAction,
      response: finalResponse,
      data: sqlResult.data,
      sqlQuery,
    })
  } catch (error) {
    console.error("Error in handleChat:", error)
    handleError(error, res)
  }
  return
}

/**
 * Handler per l'endpoint GET /initial-statistics
 */
const handleInitialStatistics: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const token = req.query.token as string
    if (!token) {
      res.status(400).json({ message: "Token is required." })
      return
    }

    const userId = await validateToken(token, res)
    if (!userId) {
      return
    }

    const promptData = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!promptData) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }
    const { model, temperature, prompt } = promptData

    const statistics = await fetchInitialStatistics()

    const summaryPrompt = `Based on the following statistics: ${JSON.stringify(
      statistics
    )}, provide a high-level summary.`

    const requestPayload = {
      model: model,
      messages: [{ role: "system", content: summaryPrompt }],
      max_tokens: 1000,
      temperature: temperature,
    }

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      { headers: OPENROUTER_HEADERS, timeout: 30000 }
    )

    const summary =
      openaiResponse.data.choices[0]?.message?.content?.trim() ||
      "No summary provided."

    res.status(200).json({ summary, statistics })
  } catch (error) {
    console.error("Error in initial statistics route:", error)
    handleError(error, res)
  }
}

chatbotRouter.post("/response", handleChat)
chatbotRouter.get("/initial-statistics", handleInitialStatistics)

export default chatbotRouter
