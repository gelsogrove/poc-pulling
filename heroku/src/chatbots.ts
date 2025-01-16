// Backend Update
import axios from "axios"
import dotenv from "dotenv"
import { Request, Response, Router } from "express"
import { ConversationalRetrievalChain, OpenAI } from "langchain"
import { fetchInitialStatistics, getPromptConfig } from "./chatbots_utility"

dotenv.config()

const chatbotRouter = Router()
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

// Handle Chat Requests
chatbotRouter.post("/response", async (req: Request, res: Response) => {
  try {
    const { conversationId, token, messages } = req.body

    if (!conversationId || !token || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({
          message: "conversationId, token, and messages array are required.",
        })
    }

    const promptConfig = await getPromptConfig(
      "a2c502db-9425-4c66-9d92-acd3521b38b5"
    )
    if (!promptConfig) {
      return res
        .status(404)
        .json({ message: "Prompt configuration not found." })
    }

    const langchainModel = new OpenAI({
      modelName: promptConfig.model, // Use model from promptConfig
      temperature: promptConfig.temperature || 0.2,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
    })

    const chain = ConversationalRetrievalChain.fromLLM(langchainModel)
    const langchainResponse = await chain.call({
      question: messages[messages.length - 1]?.content,
      chat_history: messages,
    })

    res.status(200).json({
      triggerAction: "response",
      response: langchainResponse.text,
    })
  } catch (error) {
    console.error("Error in chatbot response:", error)
    res.status(500).json({ message: "Internal server error." })
  }
})

// Initial Statistics Route
chatbotRouter.get(
  "/initial-statistics",
  async (_req: Request, res: Response) => {
    try {
      const statsCsvUrl = "https://ai.dairy-tools.com/api/stats.php?type=csv"
      const statsResponse = await axios.get(statsCsvUrl)

      const initialStatistics = await fetchInitialStatistics(statsResponse.data)
      res.status(200).json({
        triggerAction: "statistics",
        response: "Initial statistics loaded successfully.",
        data: initialStatistics,
      })
    } catch (error) {
      console.error("Error fetching initial statistics:", error)
      res.status(500).json({ message: "Error fetching initial statistics." })
    }
  }
)

export default chatbotRouter
