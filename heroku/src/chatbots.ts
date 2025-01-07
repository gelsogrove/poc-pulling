import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import { pool } from "../server.js"
import {
  processMessages,
  replaceValuesInText,
} from "./utils/extract-entities.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 500
const chatbotRouter = Router()

// Controlla che la chiave API sia impostata
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

// Funzione per validare il token utente
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

// Funzione per recuperare il prompt dal database
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

// Gestione principale della richiesta chatbot
const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, messages, model, temperature } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    const userId = await validateToken(token, res)
    if (!userId) return

    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    const apiMessages = [
      { role: "system", content: prompt },
      ...messages.map(({ role, content }) => ({ role, content })),
    ]

    const { fakeMessages, formattedEntities } = processMessages(apiMessages)

    console.log("**********Messages*********")
    console.log(messages)
    console.log("**********ENTITY**********")
    console.log(formattedEntities)
    console.log("**********END**************")

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages: fakeMessages,
        max_tokens: MAX_TOKENS,
        temperature,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    if (!openaiResponse.data.choices[0]?.message?.content) {
      res.status(500).json({ message: "Empty response from OpenAI" })
      return
    }

    const fakeAnswer = openaiResponse.data.choices[0]?.message?.content

    const restoredAnswer = replaceValuesInText(
      fakeAnswer,
      formattedEntities,
      true
    )
    console.log("Risposta Ripristinata:", restoredAnswer)

    res.status(200).json({ message: restoredAnswer })
  } catch (error) {
    console.error("Error during chat handling:", error)
    res.status(500).json({ message: "Unexpected error occurred" })
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
