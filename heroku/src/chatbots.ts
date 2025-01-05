import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Response, Router } from "express"
import { pool } from "../server.js"
import { processText, restoreOriginalText } from "./utils/extract-entities.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config() // Carica le variabili d'ambiente

const OPENROUTER_API_URL = "https://api.openrouter.com/v1/chat/completions"
const OPENROUTER_MODEL = "gpt-3.5-turbo"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // Usa la chiave API dall'ambiente
  "Content-Type": "application/json",
}
const MAX_TOKENS = 250
const TEMPERATURE = 0.2
const chatbotRouter = Router()

// Assicurati che la chiave API sia fornita
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

interface InitializeRequest {
  conversationId: string
  token: string
}

interface RespRequest extends InitializeRequest {
  message: string
}

const validateToken = async (token: string, res: Response) => {
  try {
    const userId = await getUserIdByToken(token)
    if (!userId) {
      res.status(400).json({ message: "Token non valido" })
      return null
    }
    return userId
  } catch (error) {
    console.error("Error validating token:", error)
    res.status(500).json({ message: "Error validating token" })
    return null
  }
}

const getPrompt = async (idPrompt: string): Promise<string | null> => {
  try {
    const result = await pool.query(
      "SELECT prompt FROM prompts WHERE idPrompt = $1",
      [idPrompt]
    )
    return result.rows.length > 0 ? result.rows[0].prompt : null
  } catch (error) {
    console.error("Error fetching prompt:", error)
    return null
  }
}

const initializeHandler: RequestHandler = async (req, res) => {
  const { conversationId, token } = req.body as InitializeRequest

  if (!conversationId || !token) {
    res.status(400).json({ message: "conversationId and token are required." })
    return
  }

  try {
    if (!(await validateToken(token, res))) return

    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    // CHIAMATA ALL'API DI OPENROUTER CON IL PROMPT
    const openRouterResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [{ role: "system", content: prompt }],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    // Invia la risposta dell'API al client
    res.status(200).json(openRouterResponse.data.choices[0].message.content)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message)
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: error.message })
    } else {
      console.error("Unexpected error:", error)
      res.status(500).json({ message: "Unexpected error occurred" })
    }
  }
}

const respHandler: RequestHandler = async (req, res) => {
  const { conversationId, token, message } = req.body as RespRequest

  if (!conversationId || !token || !message) {
    res
      .status(400)
      .json({ message: "conversationId, token, and message are required." })
    return
  }

  try {
    // CHECK TOKEN
    if (!(await validateToken(token, res))) return

    // PROCESSED MESSAGE NPL
    const { fakeText, formattedEntities } = processText(message)

    // CHIAMATA ALL'API DI OPENROUTER
    const openRouterResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: fakeText }],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    // REVERT MESSAGE NLP
    const resp = openRouterResponse.data.choices[0].message.content
    const originalResponseText = restoreOriginalText(resp, formattedEntities)

    // SEND
    res.status(200).json(originalResponseText)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message)
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: error.message })
    } else {
      console.error("Unexpected error:", error)
      res.status(500).json({ message: "Unexpected error occurred" })
    }
  }
}

chatbotRouter.post("/initialize", initializeHandler)
chatbotRouter.post("/resp", respHandler)

export default chatbotRouter
