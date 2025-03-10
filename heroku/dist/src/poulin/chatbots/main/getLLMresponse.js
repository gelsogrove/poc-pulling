import axios from "axios";
import dotenv from "dotenv";
import { getPrompt } from "../../utility/chatbots_utility.js";
dotenv.config();
/**
 * Configurazione per le chiamate a OpenRouter
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_HEADERS = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
};
const MAX_TOKENS = 5000;
// Nuova funzione per gestire la richiesta al LLM
export const getLLMResponse = async (idPrompt, history, chatbot, cachedPromptData) => {
    try {
        // Usa il prompt dalla cache se disponibile, altrimenti lo carica
        const { prompt, model, temperature } = cachedPromptData || (await getPrompt(idPrompt));
        // Prepara il payload per il modello
        const requestPayload = {
            model,
            messages: [
                { role: "system", content: "Language: it" },
                { role: "system", content: "Language: es" },
                { role: "system", content: prompt },
                ...history,
            ],
            max_tokens: MAX_TOKENS,
            temperature: Number(temperature),
            //  response_format: { type: "json_object" },
        };
        console.log(history);
        // Invia richiesta a OpenRouter
        const openaiResponse = await axios.post(OPENROUTER_API_URL, requestPayload, {
            headers: OPENROUTER_HEADERS,
            timeout: 30000,
        });
        if (!openaiResponse.data?.choices?.length) {
            throw new Error("No response from OpenRouter!");
        }
        const rawResponse = openaiResponse.data.choices[0]?.message?.content;
        console.log("Chatbot " + chatbot + " Response: ", rawResponse);
        return { user: "assistant", content: rawResponse || "Nessuna risposta" };
    }
    catch (error) {
        return { user: "assistant", content: "errore: " + error };
    }
};
