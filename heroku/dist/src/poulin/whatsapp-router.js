import { Router } from "express";
// Riferimento al provider WhatsApp dal server principale
let whatsappProvider = null;
let whatsappInitialized = false;
const router = Router();
// Endpoint per inviare messaggi WhatsApp
router.post("/send", async (req, res) => {
    if (!whatsappInitialized) {
        return res.status(503).json({
            success: false,
            error: "Servizio WhatsApp non inizializzato",
        });
    }
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: "Destinatario e messaggio richiesti",
            });
        }
        // Formatta numero telefono (rimuovi + se presente)
        const formattedNumber = to.startsWith("+") ? to.substring(1) : to;
        const recipient = `${formattedNumber}@c.us`;
        // Supporta sia testo semplice che oggetti messaggio con media
        if (typeof message === "string") {
            await whatsappProvider.sendMessage(recipient, message);
        }
        else {
            await whatsappProvider.sendMessage(recipient, message.body, {
                media: message.media,
            });
        }
        console.log(`Messaggio WhatsApp inviato a ${to}`);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Errore nell'invio del messaggio WhatsApp:", error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
});
// API per verificare lo stato di WhatsApp
router.get("/status", (req, res) => {
    res.json({
        initialized: whatsappInitialized,
        connected: whatsappInitialized && whatsappProvider.isConnected
            ? whatsappProvider.isConnected()
            : false,
    });
});
// Funzione per impostare il provider
export function setProvider(provider, initialized = true) {
    whatsappProvider = provider;
    whatsappInitialized = initialized;
}
export default router;
