import axios from "axios";
import dotenv from "dotenv";
import { Router } from "express";
import { pool } from "../../../../server.js";
import { GetAndSetHistory } from "../../share/history.js";
import { validateRequest } from "../../share/validateUser.js";
import { cleanResponse, executeSqlQuery, generateDetailedSentence, getPrompt, } from "../../utility/chatbots_utility.js";
dotenv.config();
/**
 * Configurazione per le chiamate a OpenRouter
 * Specializzato per la gestione e l'analisi dei prodotti
 */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_HEADERS = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
};
const MAX_TOKENS = 5000;
const productRouter = Router(); // Rinominato per chiarezza
// Verifica configurazione API
if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment variables.");
}
/**
 * Gestisce le richieste al chatbot per i prodotti
 *
 * Funzionalità specifiche:
 * - Ricerca e informazioni prodotti
 * - Analisi disponibilità
 * - Gestione catalogo
 * - Statistiche prodotto
 *
 * Flusso di elaborazione:
 * 1. Validazione input e autenticazione
 * 2. Recupero configurazione prompt
 * 3. Elaborazione richiesta con OpenAI
 * 4. Analisi risultati SQL
 * 5. Generazione risposta dettagliata
 */
const handleResponse = async (req, res) => {
    // Validazione utente
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
        // Recupero e validazione prompt
        const { prompt, model, temperature } = await getPrompt(promptId);
        // Gestione history della conversazione
        const updatedHistory = await GetAndSetHistory(conversationId, promptId, userId, new Date(), message, "" // La prima volta sarà vuota, poi verrà recuperata dal DB
        );
        // Preparazione payload con contesto prodotti
        const requestPayload = {
            model,
            messages: [
                { role: "system", content: "Language: it" },
                { role: "system", content: prompt },
                ...updatedHistory,
                message,
            ],
            max_tokens: MAX_TOKENS,
            temperature: Number(temperature),
            response_format: { type: "json_object" },
        };
        console.log("\n🚀 OPENROUTER SEND:", JSON.stringify(requestPayload, null, 2));
        // Invio richiesta a OpenRouter
        const openaiResponse = await axios.post(OPENROUTER_API_URL, requestPayload, {
            headers: OPENROUTER_HEADERS,
            timeout: 30000, // 30 secondi timeout
        });
        console.log("\n📩 OPENROUTER RECEIVED:", JSON.stringify(openaiResponse.data, null, 2));
        // Elaborazione risposta
        const rawResponse = cleanResponse(openaiResponse.data.choices[0]?.message?.content);
        if (!rawResponse) {
            res.status(500).json({ error: "Empty response from OpenRouter" });
            return;
        }
        try {
            // Parsing e destrutturazione risposta
            const jsonResponse = JSON.parse(rawResponse);
            const { triggerAction = "NONE", sqlQuery = "", finalResponse = "", } = jsonResponse;
            // Esecuzione query per dati prodotti
            const sqlData = await executeSqlQuery(sqlQuery);
            // Gestione risultato singolo con dettagli
            if (sqlData.length === 1) {
                const detailedSentence = await generateDetailedSentence(model, sqlData, temperature, OPENROUTER_API_URL, OPENROUTER_HEADERS, message.content);
                res.status(200).json({
                    triggerAction: "COUNT",
                    response: detailedSentence,
                    query: sqlQuery,
                });
                return;
            }
            // Risposta standard con dati prodotti
            res.status(200).json({
                triggerAction,
                response: finalResponse,
                data: sqlData,
                query: sqlQuery,
            });
        }
        catch (parseError) {
            // Fallback per errori di parsing
            res.status(200).json({ response: rawResponse });
        }
    }
    catch (error) {
        console.error("\n❌ OPENROUTER ERROR:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
};
// Registra l'handler per le richieste POST
productRouter.post("/response", handleResponse);
export default productRouter;
