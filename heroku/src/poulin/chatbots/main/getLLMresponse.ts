import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

/**
 * Configurazione per le chiamate a OpenRouter
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

const MAX_TOKENS = 5000

interface LLMParams {
  prompt: string
  model: string
  temperature: number
}

interface LLMResponse {
  content: string
  user: string
}

/**
 * Invia una richiesta al modello LLM e ottiene una risposta
 * @param message Il messaggio dell'utente
 * @param params I parametri per il modello LLM (prompt, model, temperature)
 * @param history Opzionale: storico dei messaggi precedenti
 * @returns La risposta del modello
 */
export async function getLLMResponse(
  message: string,
  params: LLMParams,
  history: { role: string; content: string }[] = []
): Promise<LLMResponse> {
  try {
    // Prepara il payload per il modello
    const requestPayload = {
      model: params.model,
      messages: [
        { role: "system", content: "Language: it" },
        { role: "system", content: "Language: es" },
        { role: "system", content: params.prompt },
        ...history,
        { role: "user", content: message },
      ],
      max_tokens: MAX_TOKENS,
      temperature: Number(params.temperature),
    }

    // Invia richiesta a OpenRouter
    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    if (!openaiResponse.data?.choices?.length) {
      throw new Error("Nessuna risposta da OpenRouter!")
    }

    const rawResponse = openaiResponse.data.choices[0]?.message?.content

    return {
      user: "assistant",
      content: rawResponse || "Nessuna risposta",
    }
  } catch (error) {
    console.error("Errore nella chiamata al modello LLM:", error)
    throw error
  }
}
