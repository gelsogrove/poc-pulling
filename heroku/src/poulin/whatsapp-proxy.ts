import { NextFunction, Request, Response } from "express"

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

  // Nuovo endpoint per forzare la logout e riconnessione
  if (req.path === "/whatsapp/reset" && req.method === "GET") {
    handleReset(req, res)
    return
  }

  // Nuovo endpoint per visualizzare i log recenti (incluso QR code)
  if (req.path === "/whatsapp/logs" && req.method === "GET") {
    res.json({
      success: true,
      logs: getLogBuffer(),
    })
    return
  }

  // Passa alla prossima funzione middleware
  next()
}

// Funzione per forzare una nuova connessione WhatsApp
async function handleReset(req: Request, res: Response) {
  try {
    console.log("Tentativo di reset della connessione WhatsApp...")

    if (!global.whatsappProvider) {
      return res.status(503).json({
        success: false,
        error: "Provider WhatsApp non disponibile",
      })
    }

    // Metodo alternativo di reset - impostare manualmente lo stato
    global.whatsappInitialized = false

    // Stampa informazioni sul provider
    console.log("Provider WhatsApp:", Object.keys(global.whatsappProvider))

    try {
      // Prova a usare il metodo di disconnessione se disponibile
      if (typeof global.whatsappProvider.close === "function") {
        await global.whatsappProvider.close()
        console.log("Provider WhatsApp chiuso con il metodo 'close'")
      } else if (typeof global.whatsappProvider.disconnect === "function") {
        await global.whatsappProvider.disconnect()
        console.log("Provider WhatsApp disconnesso con il metodo 'disconnect'")
      } else if (typeof global.whatsappProvider.destroy === "function") {
        await global.whatsappProvider.destroy()
        console.log("Provider WhatsApp distrutto con il metodo 'destroy'")
      } else {
        // Se nessun metodo è disponibile, suggerisci di riavviare il server
        console.log(
          "Nessun metodo di disconnessione trovato. Impostato flag di inizializzazione a false."
        )
      }
    } catch (disconnectError) {
      console.error("Errore durante la disconnessione:", disconnectError)
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
