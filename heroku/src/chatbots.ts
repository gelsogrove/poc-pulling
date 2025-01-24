import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import {
  cleanResponse,
  executeSqlQuery,
  getPrompt,
  sendUsageData,
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

/**
 * Handler principale per gestire la chat.
 */
const handleChat: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  const { conversationId, idPrompt, messages } = req.body

  try {
    // VALIDATION
    if (!conversationId || !Array.isArray(messages)) {
      res.status(400).json({
        message: "conversationId and messages array are required.",
      })
      return
    }

    // USER MESSAGE
    const userMessage = messages[messages.length - 1]?.content

    // PROMPT
    const promptResult = await getPrompt(idPrompt)
    const { prompt, model, temperature } = promptResult

    // HISTORY
    const conversationHistory = messages.map((msg) => ({
      role: msg.role || "user",
      content: msg.content,
    }))

    // CUSTOM FOR PROMPT
    const hasAnalysisKeywords = conversationHistory.some((msg) =>
      ["analysis", "trend", "analisi"].some((keyword) =>
        msg.content.toLowerCase().includes(keyword)
      )
    )
    if (hasAnalysisKeywords) {
      try {
        const { data: analysis } = await axios.get(
          "https://ai.dairy-tools.com/api/stats.php"
        )

        const analysisString = JSON.stringify(analysis, null, 2)

        conversationHistory.push({
          role: "system",
          content: `Here is the analysis data:\n${analysisString}`,
        })
      } catch (analysisError) {
        console.error("Error fetching analysis data:", analysisError)
        res.status(200).json({ response: "Failed to fetch analysis data." })
        return
      }
    }
    // END CUSTOM ANALYSIS

    // PAYLOAD
    const requestPayload = {
      model,
      messages: [
        { role: "system", content: prompt },
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

    if (openaiResponse.data.error) {
      res.status(200).json({ response: openaiResponse.data.error.message })
      return
    }

    const rawResponse = cleanResponse(
      openaiResponse.data.choices[0]?.message?.content
    )
    if (!rawResponse) {
      res.status(204).json({ response: "Empty response from OpenRouter" })
      return
    }

    // PARSE RESPONSE
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
        await sendUsageData(day, 0.1, token, triggerAction, userId)
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
    console.error("********ERROR**********", error)
    res.status(500).json({ response: "Internal server error" })
  }
}

chatbotRouter.post("/response", handleChat)
export default chatbotRouter
