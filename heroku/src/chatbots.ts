import axios from "axios"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 1000
const chatbotRouter = Router()

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

console.log("API Key:", process.env.OPENROUTER_API_KEY)

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

const extractValuesFromPrompt = (
  prompt: string
): { temperature: number | null; model: string | null } => {
  try {
    const temperatureMatch = prompt.match(/TEMPERATURE:\s*([0-9.]+)/i)
    const modelMatch = prompt.match(/MODEL:\s*([a-zA-Z0-9\-_.:/]+)/i) // Include ':' e '/' per modelli complessi

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
        message:
          "La richiesta ha impiegato troppo tempo per essere elaborata. Riprova più tardi.",
      })
    } else if ((error as any).response) {
      const errorMessage =
        (error as any).response.data?.message ||
        "Errore sconosciuto dal server remoto."
      res.status(200).json({
        message: `Errore dal server remoto: ${errorMessage}`,
      })
    } else {
      res.status(200).json({
        message:
          "An unexpected error occurred. Please wait a bit and contact the  support if the issue persists.",
      })
    }
  } else {
    console.error("Unexpected error type:", error)
    res.status(500).json({
      message:
        "Errore sconosciuto. Contatta il supporto se il problema persiste.",
    })
  }
}

const handleChat: RequestHandler = async (req: Request, res: Response) => {
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
    const userId = await validateToken(token, res)
    if (!userId) return

    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    const { temperature: extractedTemperature, model: extractedModel } =
      extractValuesFromPrompt(prompt)
    const finalTemperature = extractedTemperature ?? userTemperature ?? 0.7
    const finalModel = extractedModel ?? userModel ?? "gpt-3.5-turbo"

    console.log("Using Model:", finalModel)
    console.log("Using Temperature:", finalTemperature)

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model: finalModel,
        messages: [{ role: "system", content: prompt }, ...messages],
        max_tokens: MAX_TOKENS,
        temperature: finalTemperature,
      },
      {
        headers: OPENROUTER_HEADERS,
        timeout: 15000,
      }
    )

    console.log("Response from OpenRouter:", openaiResponse.data)

    if (!openaiResponse.data.choices[0]?.message?.content) {
      res.status(204).json({ message: "Empty response from OpenRouter" })
      return
    }

    res
      .status(200)
      .json({ message: openaiResponse.data.choices[0]?.message?.content })
  } catch (error) {
    handleError(error, res)
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
