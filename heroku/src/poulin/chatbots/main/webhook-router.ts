import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express"
import webhookConfig from "./webhook-config.js"
import { ChatbotWebhookService } from "./webhook-service.js"

/**
 * Router per gestire le richieste webhook della chatbot
 */
const chatbotWebhookRouter = Router()

// Middleware per verificare che il webhook sia abilitato
const checkWebhookEnabled = ((
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!webhookConfig.enabled) {
    return res.status(404).json({
      error: "Webhook non disponibile",
      message: "Il servizio webhook per la chatbot è disabilitato",
    })
  }
  next()
}) as RequestHandler

// Wrappa il metodo di verifica del webhook con un handler appropriato
const verifyWebhookHandler = ((req: Request, res: Response) => {
  return ChatbotWebhookService.verifyWebhook(req, res)
}) as RequestHandler

// Wrappa il metodo di ricezione con un handler appropriato
const receiveMessageHandler = ((req: Request, res: Response) => {
  return ChatbotWebhookService.receiveMessage(req, res)
}) as RequestHandler

// Endpoint per la verifica del webhook (gestisce la richiesta di verifica)
chatbotWebhookRouter.get("/verify", verifyWebhookHandler)

// Endpoint per ricevere messaggi (gestisce i messaggi in entrata)
chatbotWebhookRouter.post(
  "/receive",
  checkWebhookEnabled,
  receiveMessageHandler
)

// Endpoint di stato per verificare se il webhook è attivo
chatbotWebhookRouter.get("/status", ((req: Request, res: Response) => {
  res.status(200).json({
    status: webhookConfig.enabled ? "enabled" : "disabled",
    timestamp: new Date().toISOString(),
  })
}) as RequestHandler)

// Esportiamo il router
export default chatbotWebhookRouter
