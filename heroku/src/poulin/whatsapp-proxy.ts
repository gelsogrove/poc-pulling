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

  // Passa alla prossima funzione middleware
  next()
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
