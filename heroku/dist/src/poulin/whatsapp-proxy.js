import serveDashboard, { generateQRImage, serveCSS, serveJS, } from "./whatsapp-dashboard.js";
// Crea una funzione middleware che gestisce le richieste WhatsApp
export function whatsappMiddleware(req, res, next) {
    // Gestisci solo le richieste al percorso /whatsapp
    if (!req.path.startsWith("/whatsapp")) {
        return next();
    }
    // Endpoint per la dashboard di gestione
    if (req.path === "/whatsapp/dashboard" && req.method === "GET") {
        serveDashboard(req, res);
        return;
    }
    // Endpoint per servire il CSS della dashboard
    if (req.path === "/whatsapp/dashboard.css" && req.method === "GET") {
        serveCSS(req, res);
        return;
    }
    // Endpoint per servire il JavaScript della dashboard
    if (req.path === "/whatsapp/dashboard.js" && req.method === "GET") {
        serveJS(req, res);
        return;
    }
    // Endpoint per generare l'immagine QR code
    if (req.path === "/whatsapp/qrcode" && req.method === "GET") {
        generateQRImage(req, res);
        return;
    }
    // Gestisci l'endpoint di invio
    if (req.path === "/whatsapp/send" && req.method === "POST") {
        handleSendMessage(req, res);
        return;
    }
    // Gestisci l'endpoint di stato
    if (req.path === "/whatsapp/status" && req.method === "GET") {
        handleStatus(req, res);
        return;
    }
    // Endpoint per forzare la logout e riconnessione
    if (req.path === "/whatsapp/reset" && req.method === "GET") {
        handleReset(req, res);
        return;
    }
    // Endpoint per visualizzare i log recenti (incluso QR code)
    if (req.path === "/whatsapp/logs" && req.method === "GET") {
        res.json({
            success: true,
            logs: getLogBuffer(),
        });
        return;
    }
    // Endpoint per forzare la generazione del QR code
    if (req.path === "/whatsapp/force-qr" && req.method === "GET") {
        handleForceQR(req, res);
        return;
    }
    // Passa alla prossima funzione middleware
    next();
}
// Funzione per forzare la generazione di un nuovo QR code
async function handleForceQR(req, res) {
    try {
        captureLog("Tentativo di forzare la generazione di un nuovo QR code...");
        // Reset completo delle variabili globali
        global.whatsappInitialized = false;
        if (global.whatsappProvider) {
            global.whatsappProvider = null;
        }
        captureLog("Stato WhatsApp resettato. Inizializzazione nuova istanza...");
        // Genera un QR code statico semplice come fallback
        const backupQRCode = "https://wa.me/34654728753"; // URL per connettere direttamente al numero
        captureLog("Generato QR code di backup: " + backupQRCode);
        try {
            // Tentativo forzato di inizializzazione
            captureLog("Tentativo di importare i moduli necessari...");
            const { BaileysProvider } = await import("@builderbot/provider-baileys");
            const { createBot, createFlow, addKeyword, createProvider } = await import("@builderbot/bot");
            captureLog("Moduli importati. Configurazione nuova istanza WhatsApp...");
            // Usa una sessione unica basata sul timestamp
            const sessionId = Date.now();
            const sessionPath = `./whatsapp-session-${sessionId}`;
            captureLog(`Creazione sessione temporanea: ${sessionPath}`);
            // Configurazione di un flow di test
            const catchAllFlow = addKeyword(".*").addAction(async (ctx) => {
                captureLog(`[QR-TEST] Messaggio ricevuto: ${ctx.body}`);
            });
            // Crea un provider separato solo per questo test
            captureLog("Configurazione provider WhatsApp temporaneo...");
            const tempProvider = createProvider(BaileysProvider, {
                sessionPath: sessionPath,
                printQRInTerminal: true,
                browser: ["Poulin WhatsApp Test", "Chrome", "10.0"],
                qrcode: {
                    generate: (qr) => {
                        captureLog("QRCODE_FORZATO_START =============================");
                        captureLog("Scansiona questo codice QR con WhatsApp (+34654728753):");
                        captureLog(qr); // Salviamo il QR code nei log
                        captureLog("QRCODE_FORZATO_END ===============================");
                        // Salva il QR code per restituirlo all'utente
                        res.locals.qrCode = qr;
                    },
                },
            });
            captureLog("Provider WhatsApp configurato. Tentativo creazione bot...");
            // Crea un database temporaneo solo per questo test
            const adapterDB = { save: () => { }, get: () => { } };
            // Configurazione flow
            const adapterFlow = createFlow([catchAllFlow]);
            // Inizializza una nuova istanza di bot
            captureLog("Inizializzazione bot temporaneo...");
            const botPromise = createBot({
                flow: adapterFlow,
                provider: tempProvider,
                database: adapterDB,
            });
            captureLog("Bot temporaneo in fase di inizializzazione. Attesa per QR code...");
            // Attendiamo fino a 10 secondi per il QR code
            setTimeout(() => {
                if (res.locals && res.locals.qrCode) {
                    captureLog("QR code generato con successo!");
                    res.json({
                        success: true,
                        message: "QR code generato con successo",
                        qrCode: res.locals.qrCode,
                    });
                }
                else {
                    // Se non è stato generato il QR code, usiamo il backup
                    captureLog("QR code non ricevuto dal provider, uso il QR di backup");
                    res.json({
                        success: true,
                        message: "QR code di backup generato",
                        qrCode: backupQRCode,
                    });
                }
            }, 10000);
        }
        catch (initError) {
            captureLog("Errore nell'inizializzazione forzata: " + String(initError));
            // In caso di errore, restituisci il QR code di backup
            res.json({
                success: true,
                message: "QR code di backup generato dopo errore",
                qrCode: backupQRCode,
            });
        }
    }
    catch (error) {
        captureLog("Errore durante la generazione forzata del QR code: " + String(error));
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
}
// Funzione per forzare una nuova connessione WhatsApp
async function handleReset(req, res) {
    try {
        console.log("Tentativo di reset della connessione WhatsApp...");
        // Reset dello stato a livello globale
        global.whatsappInitialized = false;
        if (global.whatsappProvider) {
            // Stampa informazioni sul provider
            console.log("Provider WhatsApp:", Object.keys(global.whatsappProvider));
            try {
                // Prova diversi metodi per scollegare il provider
                if (typeof global.whatsappProvider.close === "function") {
                    await global.whatsappProvider.close();
                    console.log("Provider WhatsApp chiuso con il metodo 'close'");
                }
                else if (typeof global.whatsappProvider.disconnect === "function") {
                    await global.whatsappProvider.disconnect();
                    console.log("Provider WhatsApp disconnesso con il metodo 'disconnect'");
                }
                else if (typeof global.whatsappProvider.destroy === "function") {
                    await global.whatsappProvider.destroy();
                    console.log("Provider WhatsApp distrutto con il metodo 'destroy'");
                }
                else {
                    console.log("Nessun metodo di disconnessione trovato. Reset manuale...");
                }
            }
            catch (disconnectError) {
                console.error("Errore durante la disconnessione:", disconnectError);
            }
            // Reset forzato
            global.whatsappProvider = null;
        }
        console.log("Reset WhatsApp completato. Sarà richiesto un nuovo QR code al riavvio.");
        res.json({
            success: true,
            message: "Sessione WhatsApp resettata. Riavvia l'applicazione per generare un nuovo QR code.",
        });
    }
    catch (error) {
        console.error("Errore durante il reset di WhatsApp:", error);
        res.status(500).json({
            success: false,
            error: String(error),
        });
    }
}
// Funzione per gestire l'invio di messaggi
async function handleSendMessage(req, res) {
    if (!global.whatsappInitialized || !global.whatsappProvider) {
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
            await global.whatsappProvider.sendMessage(recipient, message);
        }
        else {
            await global.whatsappProvider.sendMessage(recipient, message.body, {
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
}
// Funzione per controllare lo stato di WhatsApp
function handleStatus(req, res) {
    res.json({
        initialized: global.whatsappInitialized || false,
        connected: global.whatsappInitialized &&
            global.whatsappProvider &&
            global.whatsappProvider.isConnected
            ? global.whatsappProvider.isConnected()
            : false,
    });
}
// Mantieni un buffer degli ultimi messaggi di log per catturare il QR code
const MAX_LOG_ENTRIES = 100;
// Inizializza il buffer con un messaggio iniziale
const logBuffer = [
    "Sistema di log inizializzato - " + new Date().toISOString(),
];
// Funzione per registrare i log
export function captureLog(message) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${message}`;
        // Debug output diretto alla console per debugging
        console.log(`[LOG CAPTURE] ${logEntry}`);
        // Aggiungi il log al buffer
        logBuffer.push(logEntry);
        // Mantieni solo gli ultimi MAX_LOG_ENTRIES entries
        if (logBuffer.length > MAX_LOG_ENTRIES) {
            logBuffer.shift();
        }
    }
    catch (error) {
        console.error("Errore nel sistema di logging:", error);
    }
}
// Aggiungi all'export per rendere disponibile il buffer dei log
export function getLogBuffer() {
    try {
        // Debug output diretto alla console
        console.log(`[LOG BUFFER] Lunghezza attuale del buffer: ${logBuffer.length}`);
        return logBuffer;
    }
    catch (error) {
        console.error("Errore nel recupero del buffer di log:", error);
        return ["Errore nel recupero dei log: " + String(error)];
    }
}
