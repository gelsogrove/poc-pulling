import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express"
import webhookConfig from "./webhook-config.js"
import { ChatbotWebhookService, WhatsAppMessage } from "./webhook-service.js"

/**
 * Router per gestire le richieste webhook della chatbot
 */
const chatbotWebhookRouter = Router()

// Middleware per verificare che il webhook sia abilitato
const checkWebhookEnabled: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!webhookConfig.enabled) {
    res.status(404).json({
      error: "Webhook non disponibile",
      message: "Il servizio webhook per la chatbot è disabilitato",
    })
    return
  }
  next()
}

// Verifica del webhook
const verifyWebhookHandler: RequestHandler = async (req, res, next) => {
  try {
    await ChatbotWebhookService.verifyWebhook(req, res)
  } catch (error) {
    console.error("Errore nella verifica del webhook:", error)
    res.status(500).json({ error: "Errore interno del server" })
  }
}

// Ricezione dei messaggi
const receiveMessageHandler: RequestHandler = async (req, res, next) => {
  try {
    // Verifica che ci sia un messaggio valido
    if (!req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      res.status(400).json({ error: "Formato messaggio non valido" })
      return
    }

    const whatsappMessage = req.body.entry[0].changes[0].value.messages[0]

    // Converti il messaggio nel formato WhatsAppMessage
    const message: WhatsAppMessage = {
      from: whatsappMessage.from,
      text: {
        body: whatsappMessage.text.body,
      },
      timestamp: whatsappMessage.timestamp,
      id: whatsappMessage.id,
    }

    const response = await ChatbotWebhookService.receiveMessage(message)
    res.status(200).json({
      status: "success",
      data: response,
    })
  } catch (error) {
    console.error("Errore nella gestione del messaggio:", error)
    res.status(500).json({ error: "Errore interno del server" })
  }
}

// Endpoint di stato per verificare se il webhook è attivo
const statusHandler: RequestHandler = (req, res, next) => {
  res.status(200).json({
    status: webhookConfig.enabled ? "enabled" : "disabled",
    timestamp: new Date().toISOString(),
  })
}

// Registra gli handler per le richieste
chatbotWebhookRouter.get("/webhook", verifyWebhookHandler)
chatbotWebhookRouter.post("/webhook", receiveMessageHandler)
chatbotWebhookRouter.get("/status", statusHandler)

// Esportiamo il router
export default chatbotWebhookRouter
