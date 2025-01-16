// Backend Update
import axios from "axios"
import dotenv from "dotenv"
import { Request, Response, Router } from "express"
import { fetchInitialStatistics } from "./chatbots_utility"

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

// Initial Statistics Route
chatbotRouter.get(
  "/initial-statistics",
  async (_req: Request, res: Response) => {
    try {
      const statsCsvUrl = "https://ai.dairy-tools.com/api/stats.php?type=csv"
      const statsResponse = await axios.get(statsCsvUrl)

      const initialStatistics = await fetchInitialStatistics()
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
