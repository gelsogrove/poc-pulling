import axios from "axios" // Per effettuare richieste HTTP
import dotenv from "dotenv" // Per caricare variabili d'ambiente
import { RequestHandler, Router } from "express" // Per gestire richieste HTTP con Express
import { pool } from "../server.js" // Connessione al database
import {
  processMessages, // Funzione per processare messaggi ed estrarre entità
  replaceValuesInText, // Funzione per ripristinare valori originali
} from "./utils/extract-entities.js"
import { getUserIdByToken } from "./validateUser.js" // Validazione del token utente

dotenv.config() // Carica le variabili d'ambiente da un file .env

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions" // URL API OpenRouter
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // Chiave API per autenticazione
  "Content-Type": "application/json", // Tipo di contenuto delle richieste
}
const MAX_TOKENS = 500 // Numero massimo di token per la risposta
const chatbotRouter = Router() // Inizializza il router per le rotte chatbot

// Verifica che la chiave API sia impostata
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

// Funzione per validare il token utente
const validateToken = async (token: string, res: any) => {
  try {
    const userId = await getUserIdByToken(token) // Ottiene l'ID utente dal token
    if (!userId) {
      res.status(400).json({ message: "Token non valido" }) // Token non valido
      return null
    }
    return userId // Restituisce l'ID utente se il token è valido
  } catch (error) {
    console.error("Error validating token:", error) // Log errore
    res.status(500).json({ message: "Error validating token" }) // Risposta errore
    return null
  }
}

// Funzione per recuperare il prompt dal database
const getPrompt = async (idPrompt: string): Promise<string | null> => {
  try {
    const result = await pool.query(
      "SELECT prompt FROM prompts WHERE idPrompt = $1", // Query al database
      [idPrompt]
    )
    return result.rows.length > 0 ? result.rows[0].prompt : null // Restituisce il prompt se trovato
  } catch (error) {
    console.error("Error fetching prompt:", error) // Log errore
    return null
  }
}

// Gestione principale della richiesta chatbot
const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, messages, model, temperature } = req.body // Estrae i parametri dal corpo della richiesta

  // Controllo dei parametri obbligatori
  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    // Validazione del token
    const userId = await validateToken(token, res)
    if (!userId) return

    // Recupera il prompt dal database
    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." }) // Prompt non trovato
      return
    }

    // Prepara i messaggi da inviare all'API
    const apiMessages = [
      { role: "system", content: prompt }, // Aggiunge il prompt come messaggio di sistema
      ...messages.map(({ role, content }) => ({ role, content })), // Aggiunge i messaggi utente
    ]

    // Processa i messaggi per estrarre entità e generare fake messages
    const { fakeMessages, formattedEntities } = processMessages(messages)

    // Debug: stampa messaggi ed entità
    console.log("**********Messages*********")
    console.log(messages)
    console.log("**********ENTITY**********")
    console.log(formattedEntities)
    console.log("**********END**************")

    // Effettua la richiesta all'API OpenRouter
    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages: fakeMessages,
        max_tokens: MAX_TOKENS,
        temperature,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    // Verifica che ci sia una risposta valida
    if (!openaiResponse.data.choices[0]?.message?.content) {
      res.status(500).json({ message: "Empty response from OpenAI" })
      return
    }

    const fakeAnswer = openaiResponse.data.choices[0]?.message?.content // Estrae la risposta fake

    // Ripristina i valori originali nella risposta
    const restoredAnswer = replaceValuesInText(
      fakeAnswer,
      formattedEntities,
      true
    )
    console.log("Risposta Ripristinata:", restoredAnswer) // Debug della risposta ripristinata

    // Invia la risposta al client
    res.status(200).json({ message: restoredAnswer })
  } catch (error) {
    // Gestione degli errori
    console.error("Error during chat handling:", error)
    res.status(500).json({ message: "Unexpected error occurred" })
  }
}

// Definisce la rotta POST per il chatbot
chatbotRouter.post("/response", handleChat)

export default chatbotRouter // Esporta il router per essere utilizzato altrove
