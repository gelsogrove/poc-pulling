import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"

// Importazione delle funzioni utilitarie dal modulo chatbot_utility
import { handleError, validateToken } from "./chatbots_utility.js"

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

const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, messages } = req.body
  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }
  try {
    const userId = await validateToken(token)
    if (!userId) {
      res.status(403).json({ message: "Invalid token." })
      return
    }
    // ... resto della logica ...
  } catch (error) {
    console.error("Error in handleChat:", error)
    const errorResponse = handleError(error)
    res.status(500).json(errorResponse)
  }
}

chatbotRouter.post("/response", handleChat)
export default chatbotRouter
