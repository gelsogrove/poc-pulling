import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { Router } from "express"
// Importazione delle funzioni utilitarie dal modulo chatbot_utility

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
  retryDelay: (retryCount) => {
    return retryCount * 1000
  },
  retryCondition: (error) => {
    const status = error.response?.status ?? 0
    return error.code === "ECONNRESET" || status >= 500
  },
})

// ANALYSIS
if (["analysis", "trend", "analisi"].includes(userMessage.toLowerCase())) {
  try {
    const { data: analysis } = await axios.get(
      "https://ai.dairy-tools.com/api/stats.php"
    )

    // Trasformare i dati di analisi in una stringa leggibile
    const analysisString = JSON.stringify(analysis, null, 2)

    // Aggiungere i dati di analisi al contesto della conversazione
    conversationHistory.push({
      role: "system",
      content: `Here is the analysis data:\n${analysisString}`,
    })

    // Continuare con il chatbot
  } catch (analysisError) {
    console.error("Error fetching analysis data:", analysisError)
    res.status(200).json({
      response: "Failed to fetch analysis data.",
    })
    return
  }
}

// PAYLOAD
const requestPayload = {
  model,
  messages: [
    { role: "system", content: prompt },
    ...conversationHistory,
    { role: "user", content: userMessage },
    { role: "system", content: `Language: eng` },
  ],
  max_tokens: MAX_TOKENS,
  temperature: Number(temperature),
}

chatbotRouter.post("/response", handleChat)
export default chatbotRouter
