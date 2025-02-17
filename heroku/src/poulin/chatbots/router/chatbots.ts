import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"
import { validateRequest } from "../../share/validateUser.js"
import { cleanResponse, getPrompt } from "../../utility/chatbots_utility.js"

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

const handleResponse: RequestHandler = async (req: Request, res: Response) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return
  const { conversationId, idPrompt, messages } = req.body

  if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
    console.log("Validation failed for conversationId or messages.")
    res.status(400).json({
      message: "conversationId and non-empty messages array are required.",
    })
    return
  }

  try {
    // USER MESSAGE
    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage.content
    console.log("User message:", userMessage)

    // PROMPT
    const promptResult = await getPrompt(idPrompt)
    const { prompt, model, temperature } = promptResult
    console.log("promptResult", promptResult)

    // HISTORY
    const conversationHistory = messages.map((msg: any) => {
      return { role: msg.role || "user", content: msg.content }
    })

    // PAYLOAD
    const requestPayload = {
      model,
      messages: [
        { role: "system", content: `Language: it` },
        { role: "system", content: prompt },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
      max_tokens: MAX_TOKENS,
      temperature: Number(temperature),
      response_format: { type: "json_object" },
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
      res.status(200).json({
        response: "Empty response from OpenRouter...router",
        error: openaiResponse.data.error.message,
      })
      return
    }

    console.log("message", openaiResponse.data.choices[0]?.message?.content)
    // ANSWER
    const rawResponse = cleanResponse(
      openaiResponse.data.choices[0]?.message?.content
    )

    if (!rawResponse) {
      res.status(200).json({
        response: "Empty response from OpenRouter......generci",
        rawResponse,
      })
      return
    }

    // PARSE RESPONSE
    let sqlQuery: string | null = null
    let finalResponse: string = ""
    let triggerAction: string = ""
    try {
      const parsedResponse = JSON.parse(rawResponse)
      console.log("Parsed response:", parsedResponse)
      sqlQuery = parsedResponse.sql || null
      finalResponse = parsedResponse.response || "No response provided."
      triggerAction = parsedResponse.triggerAction || ""

      // RESPONSE
      res.status(200).json({
        triggerAction,
        response: finalResponse,
      })
    } catch (parseError) {
      res.status(200).json({ response: rawResponse })
      return
    }
  } catch (error) {
    res.status(200).json({ response: "error:" + error })
  }
}

chatbotRouter.post("/response", handleResponse)
export default chatbotRouter
