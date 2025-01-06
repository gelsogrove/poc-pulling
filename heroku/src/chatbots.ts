import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import { pool } from "../server.js"
import { processText, restoreOriginalText } from "./utils/extract-entities.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config() // Carica le variabili d'ambiente

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
//const OPENROUTER_MODEL = "openai/gpt-3.5-turbo"
//const OPENROUTER_MODEL = "anthropic/claude-instant-v1"

const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 350
const TEMPERATURE = 0.2
const chatbotRouter = Router()

// Assicurati che la chiave API sia fornita
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

const validateToken = async (token: string, res: any) => {
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

const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, name, messages } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    const userId = await validateToken(token, res)
    if (!userId) return

    // Recupera il prompt e aggiungilo come primo messaggio
    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    // Preprocesso i messaggi dell'utente
    const processedMessages = messages.map(({ role, content }) => {
      const { fakeText, formattedEntities } = processText(content)
      return { role, content: fakeText, formattedEntities }
    })

    // Aggiunge il messaggio di sistema (prompt) all'inizio
    const apiMessages = [
      { role: "system", content: prompt },
      ...processedMessages.map(({ role, content }) => ({ role, content })),
    ]

    // Chiamata all'API OpenRouter
    const openRouterResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: apiMessages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    const resp = openRouterResponse.data.choices[0].message.content
    const formattedEntities =
      processedMessages.length > 0 ? processedMessages[0].formattedEntities : []
    const finalResponse = restoreOriginalText(resp, formattedEntities)

    res.status(200).json(finalResponse)
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

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
