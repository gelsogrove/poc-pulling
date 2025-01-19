import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
// Importazione delle funzioni utilitarie dal modulo chatbot_utility
import {
  cleanResponse,
  executeSqlQuery,
  getPrompt,
  sendUsageData,
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
    // VALIDATION
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

    // USER MESSAGE
    const userMessage = messages[messages.length - 1]?.content
    console.log("Message", userMessage)

    // PROMPT
    const promptResult = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    const { prompt, model, temperature } = promptResult
    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()
    console.log("Prompt:", truncatedPrompt.slice(0, 20))

    // HISTORY
    const conversationHistory = messages.map((msg) => {
      return { role: msg.role || "user", content: msg.content }
    })

    // ANALYSIS
    if (["analysis", "trend"].includes(userMessage.toLowerCase())) {
      try {
        const { data: analysis } = await axios.get(
          "https://ai.dairy-tools.com/api/stats.php"
        )

        console.log("Analysis Data:", analysis)

        res.status(200).json({
          response: `Here is the analysis: ${JSON.stringify(analysis)}`,
        })
        return
      } catch (analysisError) {
        console.error("Error fetching analysis data:", analysisError)
        res.status(500).json({
          response: "Failed to fetch analysis data.",
        })
        return
      }
    }

    // PAYLOAD
    const requestPayload = {
      model,
      messages: [
        { role: "system", content: truncatedPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "system", content: `Language: eng` },
      ],
      max_tokens: MAX_TOKENS,
      temperature: Number(temperature),
    }

    // OPENROUTER
    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    // ANSWER
    const rawResponse = cleanResponse(
      openaiResponse.data.choices[0]?.message?.content
    )
    if (!rawResponse) {
      res.status(204).json({ response: "Empty response from OpenRouter" })
      return
    }

    let sqlQuery: string | null = null
    let finalResponse: string = ""
    let triggerAction: string = ""
    try {
      const parsedResponse = JSON.parse(rawResponse)
      sqlQuery = parsedResponse.sql || null
      finalResponse = parsedResponse.response || "No response provided."
      triggerAction = parsedResponse.triggerAction || ""

      if (sqlQuery !== null) {
        const day = new Date().toISOString().split("T")[0]
        await sendUsageData(day, 0.2, token, triggerAction)
      }

      if (!sqlQuery) {
        res.status(200).json({
          triggerAction,
          response: finalResponse,
        })
        return
      }

      // EXECUTE QUERY
      const sqlData = await executeSqlQuery(sqlQuery)
      res.status(200).json({
        triggerAction,
        response: finalResponse,
        data: sqlData,
        query: sqlQuery,
      })
    } catch (parseError) {
      res.status(200).json({ response: rawResponse })
      return
    }
  } catch (error) {
    console.error("Error in handleChat:", error)

    res.status(500).json(error)
  }
}

chatbotRouter.post("/response", handleChat)
export default chatbotRouter
