import axios from "axios"
import axiosRetry from "axios-retry"
import dotenv from "dotenv"
import { Request, Response, Router } from "express"
import { LLMChain, PromptTemplate } from "langchain"
import { OpenAI } from "langchain/llms/openai"
import {
  detectLanguage,
  executeSqlQuery,
  fetchInitialStatistics,
  getPrompt,
  handleError,
  validateToken,
} from "./chatbots_utility"

dotenv.config()

const chatbotRouter = Router()

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    console.log(`Retry attempt: ${retryCount}`)
    return retryCount * 1000
  },
  retryCondition: (error) => {
    if (error.code === "ECONNRESET") {
      return true
    }
    const status = error.response?.status
    return status !== undefined && status >= 500
  },
})

const handleChat = async (req: Request, res: Response): Promise<void> => {
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

    const userMessage = messages[messages.length - 1]?.content
    if (!userMessage) {
      res.status(400).json({ message: "No user message provided." })
      return
    }

    const detectedLanguage = await detectLanguage(userMessage)

    const promptConfig = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!promptConfig) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    const { prompt, model, temperature } = promptConfig
    const truncatedPrompt = prompt.split("=== ENDPROMPT ===")[0].trim()

    const langchainModel = new OpenAI({
      modelName: model,
      temperature: temperature,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
    })

    const template = new PromptTemplate({
      template: truncatedPrompt,
      inputVariables: ["userMessage", "detectedLanguage"],
    })

    const chain = new LLMChain({ llm: langchainModel, prompt: template })
    const chainResponse = await chain.call({ userMessage, detectedLanguage })

    let sqlQuery: string | null = null
    let finalResponse: string = ""
    let triggerAction: string = ""

    try {
      const parsedResponse = JSON.parse(chainResponse.text)
      sqlQuery = parsedResponse.sql || null
      finalResponse = parsedResponse.response || "No response provided."
      triggerAction = parsedResponse.triggerAction || ""
    } catch (error) {
      console.error("Error parsing LangChain response:", error)
      res
        .status(500)
        .json({ message: "Invalid response format from LangChain." })
      return
    }

    if (!sqlQuery) {
      console.log("No SQL query provided. Sending response only.")
      res.status(200).json({ triggerAction, response: finalResponse })
      return
    }

    console.log("Executing SQL Query via SQL API:", sqlQuery)

    try {
      const sqlResult = await executeSqlQuery(sqlQuery)

      const formattedResponse = await chain.call({
        userMessage: finalResponse,
        detectedLanguage,
        sqlData: sqlResult,
      })

      res.status(200).json({
        triggerAction,
        response: formattedResponse.text,
        data: sqlResult,
        sqlQuery,
      })
    } catch (sqlError) {
      console.error("SQL execution error:", sqlError)
      res.status(500).json({ message: "Failed to execute SQL query." })
    }
  } catch (error) {
    console.error("Error in handleChat:", error)
    const errorMessage = handleError(error)
    res.status(500).json(errorMessage)
  }
}

const provideInitialStatistics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const statistics = await fetchInitialStatistics()

    const langchainModel = new OpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: process.env.OPENROUTER_API_KEY,
    })

    const template = new PromptTemplate({
      template:
        "Based on the following statistics: {{statistics}}, provide a high-level summary.",
      inputVariables: ["statistics"],
    })

    const chain = new LLMChain({ llm: langchainModel, prompt: template })

    const chainResponse = await chain.call({
      statistics: JSON.stringify(statistics),
    })

    res.status(200).json({ summary: chainResponse.text, statistics })
  } catch (error) {
    console.error("Error fetching initial statistics:", error)
    res.status(500).json({ message: "Failed to fetch initial statistics." })
  }
}

chatbotRouter.post("/response", handleChat)
chatbotRouter.get("/initial-statistics", provideInitialStatistics)

export default chatbotRouter
