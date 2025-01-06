import axios from "axios"
import { RequestHandler, Router } from "express"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"
// Import OpenTelemetry packages
import { trace } from "@opentelemetry/api"
import { registerInstrumentations } from "@opentelemetry/instrumentation"
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import dotenv from "dotenv"
dotenv.config() // Carica le variabili d'ambiente

// Initialize OpenTelemetry
const provider = new NodeTracerProvider()
provider.register()
registerInstrumentations({
  instrumentations: [new ExpressInstrumentation()],
})

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_MODEL = "openai/gpt-4"

const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 350
const chatbotRouter = Router()

// Assicurati che la chiave API sia fornita
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
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
  // Start a new span for the request
  const span = trace.getTracer("chatbot").startSpan("handleChat")

  const { conversationId, token, name, messages, model, temperature } = req.body

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
    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages: apiMessages,
        max_tokens: MAX_TOKENS,
        temperature,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    // Postprocesso la risposta
    const resp = openaiResponse.data.choices[0].message?.content

    console.log("*************************")
    console.log(resp)

    res.status(200).json(resp)
  } catch (error) {
    // End the span on error
    if (error instanceof Error) {
      span.recordException(error)
      span.setStatus({ code: 2 }) // Set status to ERROR
      console.error("Error message:", error.message)
      console.error("Stack trace:", error.stack)
    } else {
      console.error("Unknown error:", error)
    }
    res.status(500).json({ message: "Unexpected error occurred" })
  } finally {
    span.end()
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
