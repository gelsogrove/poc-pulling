import axios from "axios";
import { getLLMResponse } from "./getLLMresponse.js";
import webhookConfig from "./webhook-config.js";
// Classe per gestire i log con timestamp
class Logger {
    static log(type, message, details) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [WEBHOOK] [${type}]: ${message}`);
        if (details) {
            console.log(JSON.stringify(details, null, 2));
        }
    }
}
/**
 * Servizio webhook per la chatbot
 */
export class ChatbotWebhookService {
    /**
     * Verifica la richiesta di webhooks in arrivo
     */
    static async verifyWebhook(req, res) {
        // Se il webhook è disabilitato, restituisci un errore
        if (!webhookConfig.enabled) {
            Logger.log("VERIFY", "Webhook disabilitato");
            return res.status(403).json({ error: "Webhook disabilitato" });
        }
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];
        if (mode && token) {
            if (mode === "subscribe" && token === webhookConfig.verifyToken) {
                Logger.log("VERIFY", "Webhook verificato con successo");
                return res.status(200).send(challenge);
            }
            Logger.log("VERIFY", "Verifica fallita: token non valido", {
                receivedToken: token,
                expectedToken: webhookConfig.verifyToken,
            });
            return res.sendStatus(403);
        }
        Logger.log("VERIFY", "Verifica fallita: parametri mancanti");
        return res.sendStatus(400);
    }
    /**
     * Gestisce i messaggi in arrivo dal webhook
     */
    static async receiveMessage(req, res) {
        // Se il webhook è disabilitato, restituisci un errore
        if (!webhookConfig.enabled) {
            Logger.log("RECEIVE", "Webhook disabilitato");
            return res.status(403).json({ error: "Webhook disabilitato" });
        }
        try {
            const data = req.body;
            Logger.log("RECEIVED", "Messaggio ricevuto", data);
            // Estrae il messaggio dai dati ricevuti
            // La struttura effettiva dipende dall'API che stai utilizzando
            const message = ChatbotWebhookService.extractMessageFromPayload(data);
            if (!message) {
                Logger.log("RECEIVE", "Nessun messaggio valido trovato nella richiesta");
                return res
                    .status(400)
                    .json({ error: "Nessun messaggio valido trovato" });
            }
            // Elabora il messaggio (in modo asincrono senza bloccare la risposta)
            ChatbotWebhookService.processMessage(message).catch((error) => {
                Logger.log("ERROR", "Errore nel processare il messaggio", error);
            });
            // Risponde immediatamente per evitare timeout
            return res.status(200).json({ status: "Messaggio ricevuto" });
        }
        catch (error) {
            Logger.log("ERROR", "Errore nel processare la richiesta", error);
            return res.status(500).json({ error: "Errore del server" });
        }
    }
    /**
     * Estrae il messaggio dalla struttura del payload
     * Questo metodo deve essere adattato al formato specifico dell'API utilizzata
     */
    static extractMessageFromPayload(data) {
        try {
            // Log completo del payload per debug
            console.log("Payload ricevuto:", JSON.stringify(data, null, 2));
            // Ignora le notifiche di stato dei messaggi
            if (data.entry &&
                data.entry[0]?.changes &&
                data.entry[0].changes[0]?.value?.statuses) {
                Logger.log("STATUS", "Ricevuta notifica di stato del messaggio, ignorata");
                return null;
            }
            // Caso standard: messaggio WhatsApp in formato normale
            if (data.entry &&
                data.entry[0]?.changes &&
                data.entry[0].changes[0]?.value?.messages &&
                data.entry[0].changes[0].value.messages[0]) {
                const messageData = data.entry[0].changes[0].value.messages[0];
                // Log dei dettagli del messaggio per debug
                Logger.log("DEBUG", "Dati del messaggio estratti:", messageData);
                // Messaggio di testo
                if (messageData.type === "text" && messageData.text) {
                    return {
                        from: messageData.from,
                        text: messageData.text.body || "",
                        timestamp: parseInt(messageData.timestamp) || Date.now(),
                        messageId: messageData.id,
                    };
                }
                // Messaggio interattivo (bottoni)
                if (messageData.type === "interactive" && messageData.interactive) {
                    let text = "";
                    // Gestisci diversi tipi di interazioni
                    if (messageData.interactive.button_reply) {
                        text = `Ho selezionato: ${messageData.interactive.button_reply.title}`;
                    }
                    else if (messageData.interactive.list_reply) {
                        text = `Ho selezionato: ${messageData.interactive.list_reply.title}`;
                    }
                    return {
                        from: messageData.from,
                        text: text,
                        timestamp: parseInt(messageData.timestamp) || Date.now(),
                        messageId: messageData.id,
                    };
                }
            }
            // Formato alternativo
            if (data.message && data.sender) {
                return {
                    from: data.sender.id,
                    text: data.message.text || "",
                    timestamp: data.timestamp || Date.now(),
                    messageId: data.message.mid,
                };
            }
            console.log("Nessun formato di messaggio riconosciuto nel payload");
            return null;
        }
        catch (error) {
            Logger.log("ERROR", "Errore nell'estrazione del messaggio", error);
            return null;
        }
    }
    /**
     * Processa il messaggio ricevuto e invia una risposta
     */
    static async processMessage(message) {
        try {
            Logger.log("PROCESSING", `Elaborazione messaggio da ${message.from}`, message);
            // ID del prompt da utilizzare (può essere configurato o dinamico in base al messaggio)
            const promptId = "default-chatbot-prompt";
            // Storia vuota per un messaggio singolo
            const history = [{ role: "user", content: message.text }];
            // Nome del chatbot per il logging
            const chatbotName = "webhook-chatbot";
            // Usa un prompt predefinito invece di cercarlo nel database
            const cachedPromptData = {
                prompt: "Sei Eva, un'assistente virtuale utile e amichevole che risponde in italiano. Fornisci risposte chiare e concise alle domande degli utenti.",
                model: "gpt-4-0125-preview",
                temperature: 0.7,
            };
            // Ottiene la risposta dal modello di IA passando il prompt predefinito
            const llmResponse = await getLLMResponse(promptId, history, chatbotName, cachedPromptData);
            // Estrae il testo della risposta
            const responseText = typeof llmResponse.content === "string"
                ? llmResponse.content
                : JSON.stringify(llmResponse.content);
            // Invia la risposta all'utente
            await ChatbotWebhookService.sendMessage({
                to: message.from,
                text: responseText,
                correlationId: message.messageId,
            });
            Logger.log("PROCESSED", `Messaggio elaborato per ${message.from}`);
        }
        catch (error) {
            Logger.log("ERROR", `Errore nell'elaborazione del messaggio per ${message.from}`, error);
            throw error;
        }
    }
    /**
     * Invia un messaggio tramite l'API del webhook
     */
    static async sendMessage(message) {
        // Se il webhook è disabilitato, non inviare messaggi
        if (!webhookConfig.enabled) {
            Logger.log("SEND", "Invio messaggio fallito: webhook disabilitato");
            return false;
        }
        try {
            Logger.log("SENDING", `Invio messaggio a ${message.to}`, {
                messageText: message.text,
            });
            // Controlla se l'ID del mittente è configurato
            if (!webhookConfig.senderId) {
                Logger.log("ERROR", "SENDER_ID non configurato. Impossibile inviare messaggi.");
                return false;
            }
            // Costruisce la struttura del messaggio per WhatsApp
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: message.to,
                type: "text",
                text: {
                    preview_url: false,
                    body: message.text,
                },
            };
            // Log del payload e dell'URL per debug
            const apiUrl = `${webhookConfig.apiUrl}/${webhookConfig.senderId}/messages`;
            Logger.log("DEBUG", `Invio richiesta a: ${apiUrl}`);
            Logger.log("DEBUG", `Payload: ${JSON.stringify(payload)}`);
            Logger.log("DEBUG", `Token di autenticazione: ${webhookConfig.bearerToken ? "Configurato" : "NON configurato"}`);
            Logger.log("DEBUG", `Configurazione completa:`, {
                enabled: webhookConfig.enabled,
                apiUrl: webhookConfig.apiUrl,
                senderId: webhookConfig.senderId,
            });
            // Invia il messaggio all'API
            try {
                const response = await axios.post(apiUrl, payload, {
                    headers: {
                        Authorization: `Bearer ${webhookConfig.bearerToken}`,
                        "Content-Type": "application/json",
                    },
                });
                Logger.log("SENT", `Messaggio inviato con successo a ${message.to}`, {
                    statusCode: response.status,
                    responseData: response.data,
                });
                return true;
            }
            catch (axiosError) {
                // Log dettagliato dell'errore Axios
                Logger.log("ERROR", "Errore nella richiesta axios:", {
                    status: axiosError.response?.status,
                    statusText: axiosError.response?.statusText,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                });
                return false;
            }
        }
        catch (error) {
            Logger.log("ERROR", `Errore generale nell'invio del messaggio a ${message.to}`, error);
            return false;
        }
    }
}
