import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Response, Router } from "express"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 5000
const INCLUDE_SQL_IN_RESPONSE = false // Set to true to include SQL in frontend response
const chatbotRouter = Router()

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

axiosRetry(axios, {
  retries: 3, // Retry up to 3 times
  retryDelay: (retryCount: any) => {
    console.log(`Retry attempt: ${retryCount}`)
    return retryCount * 1000 // Incremental delay
  },
  retryCondition: (error: any) => {
    return error.code === "ECONNRESET" || error.response?.status >= 500 // Retry for connection or server errors
  },
})

const validateToken = async (token: string, res: Response) => {
  try {
    const userId = await getUserIdByToken(token)
    if (!userId) {
      res.status(400).json({ message: "Invalid token" })
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

const detectLanguage = async (message: string): Promise<string> => {
  const detectionPrompt = `
Identify the language of the following text and return the ISO 639-1 code:
"${message}"
`.trim()

  const response = await axios.post(
    OPENROUTER_API_URL,
    {
      model: "gpt-4",
      messages: [{ role: "system", content: detectionPrompt }],
      max_tokens: 10,
      temperature: 0.0,
    },
    { headers: OPENROUTER_HEADERS, timeout: 10000 }
  )

  return response.data.choices[0]?.message?.content.trim() || "en" // Default to English
}

export function handleError(error: unknown, res: Response): void {
  if (error instanceof Error) {
    console.error("Error:", {
      message: error.message,
      code: (error as any).code,
      response: (error as any).response?.data || null,
      stack: error.stack,
    })

    if ((error as any).code === "ECONNABORTED") {
      res.status(500).json({
        message: "Timeout, please try again later.",
      })
    } else if ((error as any).response) {
      const errorMessage =
        (error as any).response.data?.message || "OpenRouter error."
      res.status(200).json({
        message: `${errorMessage}`,
      })
    } else {
      res.status(200).json({
        message:
          "An unexpected error occurred. Please contact support if the issue persists.",
      })
    }
  } else {
    console.error("Unexpected error type:", error)
    res.status(500).json({
      message: "Unknown error. Please contact support if the problem persists.",
    })
  }
}

const handleChat: RequestHandler = async (req, res): Promise<void> => {
  const { conversationId, token, messages } = req.body

  // Validazione dei parametri iniziali
  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    // Validazione del token utente
    const userId = await validateToken(token, res)
    if (!userId) {
      res.status(403).json({ message: "Invalid token." })
      return
    }

    // Recupera l'ultimo messaggio dell'utente
    const userMessage = messages[messages.length - 1]?.content
    if (!userMessage) {
      res.status(400).json({ message: "No user message provided." })
      return
    }

    // Rilevamento della lingua
    const detectedLanguage = await detectLanguage(userMessage)

    // Recupero del prompt
    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()

    // Costruzione della richiesta per OpenRouter
    const requestPayload = {
      model: "gpt-4",
      messages: [
        { role: "system", content: truncatedPrompt },
        { role: "user", content: userMessage },
        { role: "system", content: `Language: ${detectedLanguage}` },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
    }

    console.log("Request Payload:", requestPayload)

    // Invio della richiesta a OpenRouter
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

    // Parsing della risposta di OpenRouter
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

    // Se non c'è SQL, restituisci solo la risposta
    if (!sqlQuery) {
      console.log("No SQL query provided. Sending response only.")
      res.status(200).json({
        triggerAction,
        response: finalResponse,
      })
      return
    }

    // Se c'è SQL, esegui la query tramite sql.php
    console.log("Executing SQL Query:", sqlQuery)
    const sqlApiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(
      sqlQuery
    )}`
    const sqlResult = await axios.get(sqlApiUrl)

    console.log("SQL Query Result:", sqlResult.data)

    // Invia il risultato SQL con la risposta
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

  // Ritorno di fallback per evitare errori di tipo
  return
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
