import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"
import { validateRequest } from "../validateUser.js"
import {
  cleanResponse,
  executeSqlQuery,
  generateDetailedSentence,
  getPrompt,
} from "./chatbots_utility.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 5000
const chatbotProductRouter = Router()

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

const handleResponse: RequestHandler = async (req: Request, res: Response) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return
  const { conversationId, idPrompt, messages } = req.body

  if (!conversationId || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid request format" })
    return
  }

  try {
    const promptData = await getPrompt(idPrompt)
    if (!promptData) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    const { prompt: systemPrompt, model, temperature } = promptData
    const userMessage = messages[messages.length - 1].content

    const requestPayload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-5),
      ],
      max_tokens: MAX_TOKENS,
      temperature: Number(temperature),
    }

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    const rawResponse = cleanResponse(
      openaiResponse.data.choices[0]?.message?.content
    )

    if (!rawResponse) {
      res.status(500).json({ error: "Empty response from OpenRouter" })
      return
    }

    try {
      const jsonResponse = JSON.parse(rawResponse)
      const {
        triggerAction = "NONE",
        sqlQuery = "",
        finalResponse = "",
      } = jsonResponse

      // EXECUTE QUERY
      const sqlData = await executeSqlQuery(sqlQuery)

      /* 2 PASSAGGIO */
      if (sqlData.length === 1) {
        // Chiamata alla funzione per generare una frase dettagliata
        const detailedSentence = await generateDetailedSentence(
          model,
          sqlData,
          temperature,
          OPENROUTER_API_URL,
          OPENROUTER_HEADERS,
          userMessage
        )

        res.status(200).json({
          triggerAction: "COUNT",
          response: detailedSentence,
          query: sqlQuery,
        })
        return
      }

      // RESPONSE
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
    res.status(200).json({ response: "error:" + error })
  }
}

chatbotProductRouter.post("/response", handleResponse)
export default chatbotProductRouter
