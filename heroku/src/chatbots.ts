import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import {
  fetchInitialStatistics,
  getPrompt,
  handleError,
  validateToken,
} from "./chatbots_utility.js" // Assicurati del path corretto

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

const MAX_TOKENS = 5000
const chatbotRouter = Router()

// ... (eventuali altre configurazioni e endpoint già presenti)

const handleChat: RequestHandler = async (req, res): Promise<void> => {
  // ... corpo della funzione handleChat
  // (puoi mantenere invariato il codice di handleChat poiché usa già le funzioni importate)
}

chatbotRouter.post("/response", handleChat)

chatbotRouter.get("/initial-statistics", async (req, res) => {
  try {
    const token = req.query.token as string
    if (!token) {
      res.status(400).json({ message: "Token is required." })
      return
    }

    const userId = await validateToken(token, res)
    if (!userId) {
      return
    }

    const promptData = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!promptData) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }
    const { model, temperature } = promptData

    const statistics = await fetchInitialStatistics()

    const summaryPrompt = `Based on the following statistics: ${JSON.stringify(
      statistics
    )}, provide a high-level summary.`

    const requestPayload = {
      model: model,
      messages: [{ role: "system", content: summaryPrompt }],
      max_tokens: 1000,
      temperature: temperature,
    }

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      { headers: OPENROUTER_HEADERS, timeout: 30000 }
    )

    const summary =
      openaiResponse.data.choices[0]?.message?.content?.trim() ||
      "No summary provided."

    res.status(200).json({ summary, statistics })
  } catch (error) {
    console.error("Error in initial statistics route:", error)
    handleError(error, res)
  }
})

export default chatbotRouter
