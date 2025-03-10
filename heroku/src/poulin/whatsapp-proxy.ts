import { NextFunction, Request, Response } from "express"
import serveDashboard from "./whatsapp-dashboard.js"

// Crea una funzione middleware che gestisce le richieste WhatsApp
export function whatsappMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Gestisci solo le richieste al percorso /whatsapp
  if (!req.path.startsWith("/whatsapp")) {
    return next()
  }

  // Endpoint per la dashboard di gestione
  if (req.path === "/whatsapp/dashboard" && req.method === "GET") {
    serveDashboard(req, res)
    return
  }

  // Gestisci l'endpoint di invio
  if (req.path === "/whatsapp/send" && req.method === "POST") {
    handleSendMessage(req, res)
    return
  }

  // Gestisci l'endpoint di stato
  if (req.path === "/whatsapp/status" && req.method === "GET") {
    handleStatus(req, res)
    return
  }

  // Endpoint per forzare la logout e riconnessione
  if (req.path === "/whatsapp/reset" && req.method === "GET") {
    handleReset(req, res)
    return
  }

  // Endpoint per visualizzare i log recenti (incluso QR code)
  if (req.path === "/whatsapp/logs" && req.method === "GET") {
    res.json({
      success: true,
      logs: getLogBuffer(),
    })
    return
  }

  // Endpoint per forzare la generazione del QR code
  if (req.path === "/whatsapp/force-qr" && req.method === "GET") {
    handleForceQR(req, res)
    return
  }

  // Passa alla prossima funzione middleware
  next()
}

// Funzione per forzare la generazione di un nuovo QR code
async function handleForceQR(req: Request, res: Response) {
  try {
    console.log("Tentativo di forzare la generazione di un nuovo QR code...")

    // Reset completo delle variabili globali
    global.whatsappInitialized = false
    global.whatsappProvider = null

    // Forza la ricarica dell'intero modulo WhatsApp
    // Questo è un hack per forzare l'inizializzazione da zero
    try {
      const { BaileysProvider } = await import("@builderbot/provider-baileys")
      const { createBot, createFlow, addKeyword, createProvider } =
        await import("@builderbot/bot")

      // Avvia una nuova inizializzazione
      console.log("Inizializzazione forzata di una nuova istanza WhatsApp...")

      const catchAllFlow = addKeyword(".*").addAction(async (ctx: any) => {
        console.log(`[FORCE-QR] Messaggio ricevuto: ${ctx.body}`)
      })

      const whatsappProvider = createProvider(BaileysProvider, {
        // Sessione unica per questa richiesta
        sessionPath: `./whatsapp-session-${Date.now()}`,
        printQRInTerminal: true,
        browser: ["Poulin WhatsApp", "Chrome", "10.0"],
        qrcode: {
          generate: (qr: string) => {
            console.log("QRCODE_FORZATO_START ==============================")
            console.log("Scansiona questo QR code con WhatsApp (+34654728753):")
            console.log(qr) // Stampiamo direttamente il QR code come testo per essere sicuri
            console.log("QRCODE_FORZATO_END ==============================")

            // Salva il QR code nell'oggetto di risposta
            res.locals.qrCode = qr
          },
        },
      })

      // Usa qualsiasi struttura dati disponibile come database in memoria
      const adapterDB = { save: () => {}, get: () => {} }
      const adapterFlow = createFlow([catchAllFlow])

      // Crea il bot ma non attenderlo
      const botPromise = createBot({
        flow: adapterFlow,
        provider: whatsappProvider,
        database: adapterDB as any,
      })

      // Attendi 5 secondi per dare tempo al QR code di essere generato
      setTimeout(() => {
        if (res.locals.qrCode) {
          res.json({
            success: true,
            message: "Nuovo QR code generato con successo",
            qrCode: res.locals.qrCode,
          })
        } else {
          res.json({
            success: false,
            message: "QR code non generato. Controlla i log di Heroku.",
          })
        }
      }, 5000)
    } catch (initError) {
      console.error("Errore nell'inizializzazione forzata:", initError)
      res.status(500).json({
        success: false,
        error: `Errore nell'inizializzazione forzata: ${String(initError)}`,
      })
    }
  } catch (error) {
    console.error("Errore durante la generazione forzata del QR code:", error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
}

// Funzione per forzare una nuova connessione WhatsApp
async function handleReset(req: Request, res: Response) {
  try {
    console.log("Tentativo di reset della connessione WhatsApp...")

    // Reset dello stato a livello globale
    global.whatsappInitialized = false

    if (global.whatsappProvider) {
      // Stampa informazioni sul provider
      console.log("Provider WhatsApp:", Object.keys(global.whatsappProvider))

      try {
        // Prova diversi metodi per scollegare il provider
        if (typeof global.whatsappProvider.close === "function") {
          await global.whatsappProvider.close()
          console.log("Provider WhatsApp chiuso con il metodo 'close'")
        } else if (typeof global.whatsappProvider.disconnect === "function") {
          await global.whatsappProvider.disconnect()
          console.log(
            "Provider WhatsApp disconnesso con il metodo 'disconnect'"
          )
        } else if (typeof global.whatsappProvider.destroy === "function") {
          await global.whatsappProvider.destroy()
          console.log("Provider WhatsApp distrutto con il metodo 'destroy'")
        } else {
          console.log(
            "Nessun metodo di disconnessione trovato. Reset manuale..."
          )
        }
      } catch (disconnectError) {
        console.error("Errore durante la disconnessione:", disconnectError)
      }

      // Reset forzato
      global.whatsappProvider = null
    }

    console.log(
      "Reset WhatsApp completato. Sarà richiesto un nuovo QR code al riavvio."
    )

    res.json({
      success: true,
      message:
        "Sessione WhatsApp resettata. Riavvia l'applicazione per generare un nuovo QR code.",
    })
  } catch (error) {
    console.error("Errore durante il reset di WhatsApp:", error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
}

// Funzione per gestire l'invio di messaggi
async function handleSendMessage(req: Request, res: Response) {
  if (!global.whatsappInitialized || !global.whatsappProvider) {
    return res.status(503).json({
      success: false,
      error: "Servizio WhatsApp non inizializzato",
    })
  }

  try {
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Destinatario e messaggio richiesti",
      })
    }

    // Formatta numero telefono (rimuovi + se presente)
    const formattedNumber = to.startsWith("+") ? to.substring(1) : to
    const recipient = `${formattedNumber}@c.us`

    // Supporta sia testo semplice che oggetti messaggio con media
    if (typeof message === "string") {
      await global.whatsappProvider.sendMessage(recipient, message)
    } else {
      await global.whatsappProvider.sendMessage(recipient, message.body, {
        media: message.media,
      })
    }

    console.log(`Messaggio WhatsApp inviato a ${to}`)
    res.json({ success: true })
  } catch (error) {
    console.error("Errore nell'invio del messaggio WhatsApp:", error)
    res.status(500).json({
      success: false,
      error: String(error),
    })
  }
}

// Funzione per controllare lo stato di WhatsApp
function handleStatus(req: Request, res: Response) {
  res.json({
    initialized: global.whatsappInitialized || false,
    connected:
      global.whatsappInitialized &&
      global.whatsappProvider &&
      global.whatsappProvider.isConnected
        ? global.whatsappProvider.isConnected()
        : false,
  })
}

// Mantieni un buffer degli ultimi messaggi di log per catturare il QR code
const MAX_LOG_ENTRIES = 50
const logBuffer: string[] = []

// Funzione per registrare i log
export function captureLog(message: string) {
  const timestamp = new Date().toISOString()
  const logEntry = `${timestamp} - ${message}`

  // Aggiungi il log al buffer
  logBuffer.push(logEntry)

  // Mantieni solo gli ultimi MAX_LOG_ENTRIES entries
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.shift()
  }

  // Stampa anche sulla console originale
  console.log(message)
}

// Aggiungi all'export per rendere disponibile il buffer dei log
export function getLogBuffer() {
  return logBuffer
}
