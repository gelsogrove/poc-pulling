import { addKeyword, createBot, createFlow, createProvider, MemoryDB, } from "@builderbot/bot";
import { BaileysProvider } from "@builderbot/provider-baileys";
import axios from "axios";
import dotenv from "dotenv";
// @ts-ignore
import qrcode from "qrcode-terminal";
// Carica le variabili d'ambiente
dotenv.config();
// Configurazioni da env
const CHATBOT_ENDPOINT = process.env.CHATBOT_ENDPOINT ||
    "http://localhost:3000/poulin/chatbot/response";
const WHATSAPP_DEFAULT_PROMPT = process.env.WHATSAPP_DEFAULT_PROMPT || "whatsapp-default";
const WHATSAPP_SESSION_PATH = process.env.WHATSAPP_SESSION_PATH || "./whatsapp-session";
// Variabili di stato
let provider = null;
let bot = null;
let isInitialized = false;
let messageHandler = null;
/**
 * Configura un handler personalizzato per i messaggi in arrivo
 * @param handler Funzione che elabora i messaggi (phoneNumber, messageText, ctx)
 */
function receiveMessage(handler) {
    messageHandler = handler;
    console.log("Handler messaggi WhatsApp configurato");
}
/**
 * Handler predefinito dei messaggi - inoltra al chatbot esistente
 */
async function defaultMessageHandler(phoneNumber, messageText) {
    console.log(`Messaggio da WhatsApp: ${phoneNumber}: ${messageText}`);
    try {
        // Inoltra al chatbot esistente
        await axios.post(CHATBOT_ENDPOINT, {
            conversationId: `whatsapp-${phoneNumber}`,
            idPrompt: WHATSAPP_DEFAULT_PROMPT,
            message: { role: "user", content: messageText },
            whatsappNumber: phoneNumber, // Marker per identificare origine WhatsApp
        });
    }
    catch (error) {
        console.error("Errore inoltro messaggio al chatbot:", error);
    }
}
/**
 * Inizializza la connessione WhatsApp con BuilderBot
 */
async function initialize() {
    if (isInitialized)
        return true;
    try {
        console.log("Inizializzazione WhatsApp con BuilderBot...");
        // Flow che cattura qualsiasi messaggio
        const catchAllFlow = addKeyword(".*").addAction(async (ctx) => {
            const phoneNumber = ctx.from.split("@")[0];
            const messageText = ctx.body;
            if (messageHandler) {
                await messageHandler(phoneNumber, messageText, ctx);
            }
            else {
                await defaultMessageHandler(phoneNumber, messageText);
            }
        });
        // Configura Baileys provider con supporto sessioni persistenti
        provider = createProvider(BaileysProvider, {
            sessionPath: WHATSAPP_SESSION_PATH,
            // Mostra QR code nel terminale per l'autenticazione
            qrcode: {
                generate: (qr) => {
                    console.log("Scansiona questo codice QR con WhatsApp per autenticare:");
                    qrcode.generate(qr, { small: true });
                },
            },
        });
        // Setup BuilderBot
        const adapterDB = new MemoryDB();
        const adapterFlow = createFlow([catchAllFlow]);
        // Crea il bot
        bot = await createBot({
            flow: adapterFlow,
            provider: provider, // Usa type assertion per evitare errori di tipizzazione
            database: adapterDB,
        });
        isInitialized = true;
        console.log("WhatsApp inizializzato con successo");
        return true;
    }
    catch (error) {
        console.error("Errore inizializzazione WhatsApp:", error);
        return false;
    }
}
/**
 * Invia un messaggio WhatsApp
 * @param to Numero di telefono destinatario
 * @param message Testo o oggetto messaggio
 */
async function sendMessage(to, message) {
    if (!isInitialized) {
        const success = await initialize();
        if (!success) {
            console.error("Impossibile inviare: WhatsApp non inizializzato");
            return false;
        }
    }
    try {
        // Formatta numero telefono (rimuovi + se presente)
        const formattedNumber = to.startsWith("+") ? to.substring(1) : to;
        const recipient = `${formattedNumber}@c.us`;
        // Supporta sia testo semplice che oggetti messaggio con media
        if (typeof message === "string") {
            await provider.sendMessage(recipient, message);
        }
        else {
            await provider.sendMessage(recipient, message.body, {
                media: message.media,
            });
        }
        console.log(`Messaggio inviato a ${to}`);
        return true;
    }
    catch (error) {
        console.error(`Errore invio a ${to}:`, error);
        return false;
    }
}
/**
 * Verifica se WhatsApp è connesso
 */
function isConnected() {
    return isInitialized && provider && provider.isConnected();
}
/**
 * Disconnette WhatsApp
 */
async function disconnect() {
    if (isInitialized && provider) {
        await provider.disconnect();
        isInitialized = false;
        console.log("WhatsApp disconnesso");
    }
}
// Esporta le funzioni pubbliche
export { disconnect, initialize, isConnected, receiveMessage, sendMessage };
