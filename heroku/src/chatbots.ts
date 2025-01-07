import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler, Router } from "express"
import { pool } from "../server.js"
import {
  processMessages,
  replaceValuesInText,
} from "./utils/extract-entities.js" // Ensure correct path

import { getUserIdByToken } from "./validateUser.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}
const MAX_TOKENS = 500
const chatbotRouter = Router()

// Controlla che la chiave API sia impostata
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in the environment variables.")
}

// Funzione per validare il token utente
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

// Funzione per recuperare il prompt dal database
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

const cleanAndParseJSON = (response: any) => {
  try {
    // Se la risposta è già un oggetto, non fare il parsing
    if (typeof response === "object") {
      return response // Se è già un oggetto, restituiamo direttamente
    }

    // Se la risposta è una stringa, eseguiamo la pulizia
    if (typeof response === "string") {
      // Sostituire gli apostrofi singoli con il loro escape
      response = response.replace(/'/g, "\\'")

      // Poi rimuoviamo eventuali caratteri speciali come le sequenze di escape che potrebbero causare errori
      response = response.replace(/\\"/g, '"')
    }

    // Parsing del JSON
    const parsedResponse = JSON.parse(response)

    // Se "message" è presente e contiene una stringa JSON
    if (parsedResponse.message && typeof parsedResponse.message === "string") {
      const cleanedMessage = parsedResponse.message
        .replace(/\\n/g, "") // Rimuove eventuali newline escape
        .replace(/\\"/g, '"') // Sostituisce le virgolette escape con quelle normali

      // Parsing del JSON annidato
      const nestedParsed = JSON.parse(cleanedMessage)
      return nestedParsed // Restituisce il JSON finale pulito
    }

    return parsedResponse // Restituiamo la risposta parsata
  } catch (error) {
    console.error("Errore durante il parsing del JSON:", error)
    return null // Restituiamo null in caso di errore
  }
}

// Gestione principale della richiesta chatbot
const handleChat: RequestHandler = async (req, res) => {
  const { conversationId, token, messages, model, temperature } = req.body

  if (!conversationId || !token || !Array.isArray(messages)) {
    res.status(400).json({
      message: "conversationId, token, and messages array are required.",
    })
    return
  }

  try {
    const userId = await validateToken(token, res)
    if (!userId) return

    const prompt = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    if (!prompt) {
      res.status(404).json({ message: "Prompt not found." })
      return
    }

    // Estrazione delle entità dai soli messaggi dell'utente
    const { fakeMessages, formattedEntities } = processMessages(messages)

    //console.log("**********ENTITY**********")
    //console.log(formattedEntities)
    console.log("**********fakeMessages**************")
    console.log(fakeMessages)
    console.log("**********END**************")

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages: [{ role: "system", content: prompt }, ...fakeMessages], // Usa il prompt originale
        max_tokens: MAX_TOKENS,
        temperature,
      },
      {
        headers: OPENROUTER_HEADERS,
      }
    )

    if (!openaiResponse.data.choices[0]?.message?.content) {
      res.status(500).json({ message: "Empty response from OpenAI" })
      return
    }

    const fakeAnswer = openaiResponse.data.choices[0]?.message?.content

    console.log(fakeAnswer)

    // Ripristina la risposta con i valori originali
    const restoredAnswer = replaceValuesInText(
      fakeAnswer,
      formattedEntities,
      true // Sostituisce i "fake values" con i valori originali
    )

    console.log("**********formattedEntities**************")
    console.log(formattedEntities)
    console.log("**********SEND TO OPENROUTER**************")
    console.log(fakeMessages)
    console.log("**********FAKE ANSWER**************")
    console.log(fakeAnswer)
    console.log("**********RESTORE ANSWER **************")
    console.log(restoredAnswer)

    res.status(200).json({ message: restoredAnswer })
  } catch (error) {
    console.error("Error during chat handling:", error)
    res.status(500).json({ message: "Unexpected error occurred" })
  }
}

chatbotRouter.post("/response", handleChat)

export default chatbotRouter
