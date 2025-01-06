import { RequestHandler, Router } from "express"
import { OpenAI } from "openai"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MAX_TOKENS = 350
const TEMPERATURE = 0.3
const chatbotRouter = Router()

// Assicurati che la chiave API sia fornita
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in the environment variables.")
}

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

const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, name, messages } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    const userId = await validateToken(token, res)
    if (!userId) return

    // Recupera il prompt e aggiungilo come primo messaggio
    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    // Aggiunge il messaggio di sistema (prompt) all'inizio
    const apiMessages = [
      { role: "system", content: prompt },
      {
        role: "system",
        content:
          "You are a sales data analyst at Poulin Grain. Your role is to analyze client sales data and generate SQL queries or JSON responses strictly based on user input. Follow these rules:\n\n1. Always respond in JSON format with the following keys:\n   - 'triggerAction': A concise action identifier (e.g., 'getTopClients').\n   - 'response': A clear and concise explanation of the action.\n   - 'data': An array, which can be empty if no additional data is available.\n   - 'sql': A PostgreSQL query matching the user's request, or null if SQL is not applicable.\n\n2. If the request is unclear, set 'triggerAction' to 'generic' and provide a helpful response.\n\n3. Use the provided examples as guidelines:\n   - 'dammi i 5 clienti che hanno venduto di più' → Generate a SQL query to list the top 5 clients by total sales.\n   - 'ciao' → Respond with a generic response asking for clarification.",
      },

      ...messages.map(({ role, content }) => ({ role, content })),
    ]

    console.log(apiMessages)

    // Chiamata all'API OpenAI
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    })

    // Postprocesso la risposta
    const resp = openaiResponse.choices[0].message?.content

    console.log("*************************")
    console.log(resp)

    res.status(200).json(resp)
  } catch (error) {
    console.error("Unexpected error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Stack trace:", error.stack)
    }
    res.status(500).json({ message: "Unexpected error occurred" })
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
