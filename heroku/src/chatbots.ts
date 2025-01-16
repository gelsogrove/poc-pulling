import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
// Importazione delle funzioni utilitarie dal modulo chatbot_utility
import { getPrompt, handleError, validateToken } from "./chatbots_utility.js"

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
    return retryCount * 1000
  },
  retryCondition: (error) => {
    const status = error.response?.status ?? 0
    return error.code === "ECONNRESET" || status >= 500
  },
})

const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, messages } = req.body

  try {
    // VALIDATAION
    if (!conversationId || !token || !Array.isArray(messages)) {
      res.status(400).json({
        message: "conversationId, token, and messages array are required.",
      })
      return
    }

    // TOKEN
    const userId = await validateToken(token)
    if (!userId) {
      res.status(403).json({ message: "Invalid token." })
      return
    }

    // USERMESSAGE
    const userMessage = messages[messages.length - 1]?.content
    console.log("Message", userMessage)

    // PROMPT
    const promptResult = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    const { prompt, model, temperature } = promptResult
    console.log("LANGUAGE MODEL USE:", model)
    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()
    console.log("Prompt:", truncatedPrompt.slice(0, 20))
    console.log("temperature:", temperature)

    // REQUEST TO OPENROUTER
    const requestPayload = {
      model,
      messages: [
        { role: "system", content: truncatedPrompt },
        { role: "user", content: userMessage },
        { role: "system", content: `Language: eng` },
      ],
      max_tokens: MAX_TOKENS,
      temperature: Number(temperature), // Conversione in numero
    }
    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    console.log("MODEL OPENROUTER USE:", requestPayload.model)
    console.log("OPENROUTER RESPONSE:", openaiResponse.data)

    const rawResponse = openaiResponse.data.choices[0]?.message?.content
    if (!rawResponse) {
      res.status(204).json({ response: "Empty response from OpenRouter" })
      return
    }
    console.log("OPENROUTER RESPONSE:", rawResponse)

    let sqlQuery: string | null = null
    let finalResponse: string = ""
    let triggerAction: string = ""
    try {
      const parsedResponse = JSON.parse(rawResponse)
      sqlQuery = parsedResponse.sql || null
      finalResponse = parsedResponse.response || "No response provided."
      triggerAction = parsedResponse.triggerAction || ""
    } catch (parseError) {
      res.status(200).json(rawResponse)
      return
    }
  } catch (error) {
    console.error("Error in handleChat:", error)
    const errorResponse = handleError(error)
    res.status(500).json(errorResponse)
  }
}

chatbotRouter.post("/response", handleChat)
export default chatbotRouter
