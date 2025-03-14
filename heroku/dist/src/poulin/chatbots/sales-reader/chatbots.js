import axios from "axios";
import axiosRetry from "axios-retry";
import dotenv from "dotenv";
import { Router } from "express";
import { pool } from "../../../../server.js";
import { GetAndSetHistory } from "../../share/history.js";
import { validateRequest } from "../../share/validateUser.js";
import { cleanResponse, getPrompt } from "../../utility/chatbots_utility.js";
dotenv.config();
/**
 * Configurazione per le chiamate a OpenRouter
 * Specializzato per l'analisi delle vendite e dati di business
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_HEADERS = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
};
const MAX_TOKENS = 5000;
const salesReaderRouter = Router();
// Verifica configurazione API
if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment variables.");
}
/**
 * Configurazione retry per gestire interruzioni di rete
 * Riprova fino a 3 volte con backoff esponenziale
 */
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => {
        const status = error.response?.status ?? 0;
        return error.code === "ECONNRESET" || status >= 500;
    },
});
/**
 * Gestisce le richieste al chatbot per l'analisi delle vendite
 *
 * Funzionalità specifiche:
 * - Analisi diretta con comando "analysis" o "trend"
 * - Esecuzione query SQL per analisi dati
 * - Generazione frasi dettagliate per risultati singoli
 * - Tracciamento usage per query SQL
 *
 * Flusso di elaborazione:
 * 1. Validazione input e autenticazione
 * 2. Gestione comandi speciali (analysis/trend)
 * 3. Preparazione e invio richiesta al modello
 * 4. Elaborazione risposta e query SQL
 * 5. Generazione risposta dettagliata se necessario
 */
const handleResponse = async (req, res) => {
    const { userId } = await validateRequest(req, res);
    if (!userId)
        return;
    const { conversationId, promptId, message } = req.body;
    // Validazione richiesta
    if (!conversationId || !message?.role || !message?.content) {
        res.status(400).json({
            message: "conversationId and message with role and content are required.",
        });
        return;
    }
    try {
        // Verifica accesso alla conversazione
        const accessQuery = `
      SELECT 1 FROM conversation_history 
      WHERE idConversation = $1 AND idUser = $2 
      LIMIT 1
    `;
        const access = await pool.query(accessQuery, [conversationId, userId]);
        if (access.rows.length === 0) {
            // Prima conversazione, permesso accordato
        }
        else if (access.rows[0].idUser !== userId) {
            res.status(403).json({
                error: "Non autorizzato ad accedere a questa conversazione",
            });
            return;
        }
        // Gestione history della conversazione
        const updatedHistory = await GetAndSetHistory(conversationId, promptId, userId, new Date(), message, "" // La prima volta sarà vuota, poi verrà recuperata dal DB
        );
        // Estrazione messaggio utente
        const userMessage = message.content;
        // Configurazione prompt e modello
        const promptData = await getPrompt(promptId);
        if (!promptData) {
            throw new Error(`Prompt not found for ID: ${promptId}`);
        }
        const { prompt, model, temperature } = promptData;
        // Gestione comandi speciali per analisi
        if (["analysis", "trend"].includes(userMessage.toLowerCase())) {
            try {
                const { data: analysis } = await axios.get("https://ai.dairy-tools.com/api/stats.php");
                res.status(200).json({
                    response: `Here is the analysis: ${JSON.stringify(analysis)}`,
                });
                return;
            }
            catch (analysisError) {
                console.error("Error fetching analysis data:", analysisError);
                res.status(200).json({
                    response: "Failed to fetch analysis data.",
                });
                return;
            }
        }
        // Preparazione payload per la richiesta
        const response = await axios.post(OPENROUTER_API_URL, {
            model,
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: userMessage },
            ],
            temperature,
            max_tokens: MAX_TOKENS,
        }, {
            headers: OPENROUTER_HEADERS,
        });
        // Gestione errori nella risposta
        if (response.data.error) {
            res.status(200).json({
                response: "Empty response from OpenRouter...sales-reader",
                error: response.data.error.message,
            });
            return;
        }
        // Pulizia e validazione della risposta
        const rawResponse = cleanResponse(response.data.choices[0]?.message?.content);
        if (!rawResponse) {
            res.status(200).json({
                response: "Empty response from OpenRouter......sales-reader",
                rawResponse,
            });
            return;
        }
    }
    catch (error) {
        console.error("\n❌ OPENROUTER ERROR:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};
// Registra l'handler per le richieste POST
salesReaderRouter.post("/response", handleResponse);
export default salesReaderRouter;
