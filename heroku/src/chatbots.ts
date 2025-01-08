import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import { pool } from "../server.js"

import { tokenize, untokenize } from "./utils/extract-entities.js"
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

// Funzione per estrarre valori da un prompt
const extractValuesFromPrompt = (
  prompt: string
): { temperature: number | null; model: string | null } => {
  try {
    const temperatureMatch = prompt.match(/TEMPERATURE:\s*([0-9.]+)/i)
    const modelMatch = prompt.match(/MODEL:\s*([a-zA-Z0-9\-_]+)/i)

    const temperature = temperatureMatch
      ? parseFloat(temperatureMatch[1])
      : null
    const model = modelMatch ? modelMatch[1] : null

    return { temperature, model }
  } catch (error) {
    console.error("Error extracting values from prompt:", error)
    return { temperature: null, model: null }
  }
}

// Gestione principale della richiesta chatbot
const handleChat: RequestHandler = async (req, res) => {
  const {
    conversationId,
    token,
    messages,
    model: userModel,
    temperature: userTemperature,
  } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    // CHECK TOKEN
    const userId = await validateToken(token, res)
    if (!userId) return

    // GET PROMPS
    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(200).json({ message: "Prompt not found." })
      return
    }
    const { temperature: extractedTemperature, model: extractedModel } =
      extractValuesFromPrompt(prompt)
    const finalTemperature = extractedTemperature ?? userTemperature ?? 0.7 // Default 0.7
    const finalModel = extractedModel ?? userModel ?? "gpt-3.5-turbo" // Default "gpt-3.5-turbo"
    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()

    // TOKENIZE
    const tokenizedMessages = messages.map((frase) =>
      tokenize(frase, conversationId)
    )
    console.log("*************TOKEN MESSAGES*********")
    console.log(tokenizedMessages)

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model: finalModel,
        messages: [
          { role: "system", content: truncatedPrompt },
          ...tokenizedMessages,
        ],
        max_tokens: MAX_TOKENS,
        temperature: finalTemperature,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    if (!openaiResponse.data.choices[0]?.message?.content) {
      res.status(200).json({ message: "Empty response from OpenAI" })
      return
    }

    console.log("*************UNTOKEN ANSWER*********")

    const content = untokenize(
      openaiResponse.data.choices[0]?.message?.content,
      conversationId
    )

    res.status(200).json({ message: content })
  } catch (error) {
    console.error("Error during chat handling:", error)
    res.status(500).json({ message: "Unexpected error occurred" })
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
