import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { Response } from "express"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount: number) => {
    console.log(`Retry attempt: ${retryCount}`)
    return retryCount * 1000
  },
  retryCondition: (error: any) => {
    return error.code === "ECONNRESET" || error.response?.status >= 500
  },
})

export const validateToken = async (token: string, res: Response) => {
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

export const getPrompt = async (
  idPrompt: string
): Promise<{ prompt: string; model: string; temperature: number } | null> => {
  try {
    const result = await pool.query(
      "SELECT prompt, model, temperature FROM prompts WHERE idPrompt = $1",
      [idPrompt]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error("Error fetching prompt:", error)
    return null
  }
}

export const detectLanguage = async (message: string): Promise<string> => {
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

  return response.data.choices[0]?.message?.content.trim() || "en"
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

export const fetchInitialStatistics = async (): Promise<any> => {
  try {
    const statsApiUrl = "https://ai.dairy-tools.com/api/stats.php?type=csv"
    const response = await axios.get(statsApiUrl)
    return response.data
  } catch (error) {
    console.error("Error fetching initial statistics:", error)
    throw error
  }
}
