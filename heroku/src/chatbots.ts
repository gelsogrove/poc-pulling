import axios from "axios"
import dotenv from "dotenv"
import { Request, Response, Router } from "express"
import { detectLanguage, getPrompt, getUserIdByToken } from "./chatbots_utility" // Percorso del file utility

dotenv.config()

const chatbotRouter: Router = Router()

chatbotRouter.post(
  "/response",
  async (req: Request, res: Response): Promise<void> => {
    const { conversationId, token, messages } = req.body

    try {
      // Validazione iniziale
      if (!conversationId || !token || !Array.isArray(messages)) {
        res.status(400).json({
          message: "conversationId, token, and messages array are required.",
        })
        return
      }

      // Validazione del token utente
      const userId = await getUserIdByToken(token)
      if (!userId) {
        res.status(403).json({ message: "Invalid token." })
        return
      }

      // Recupera l'ultimo messaggio dell'utente
      const userMessage = messages[messages.length - 1]?.content
      if (!userMessage) {
        res.status(400).json({ message: "No user message provided." })
        return
      }

      // Rilevamento della lingua
      const detectedLanguage = await detectLanguage(userMessage)

      // Recupero del prompt
      const promptConfig = await getPrompt(
        "a2c502db-9425-4c66-9d92-acd3521b38b5"
      )
      if (!promptConfig) {
        res.status(404).json({ message: "Prompt not found." })
        return
      }

      // Creazione della richiesta per il modello (LangChain o OpenRouter)
      const response = await axios.post(
        "https://ai.dairy-tools.com/api/langchain",
        {
          model: promptConfig.model,
          prompt: promptConfig.prompt,
          userMessage,
          detectedLanguage,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )

      // Elaborazione della risposta
      const { sqlQuery, responseText, triggerAction } = response.data
      if (sqlQuery) {
        // Se SQL presente, invia richiesta a sql.php
        const sqlApiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(
          sqlQuery
        )}`
        const sqlResult = await axios.get(sqlApiUrl)

        res.status(200).json({
          triggerAction,
          response: responseText,
          data: sqlResult.data,
        })
      } else {
        // Nessuna query SQL, solo risposta testuale
        res.status(200).json({
          triggerAction,
          response: responseText,
        })
      }
    } catch (error) {
      console.error("Error in /response handler:", error)
      res.status(500).json({ message: "Internal server error." })
    }
  }
)

export default chatbotRouter
