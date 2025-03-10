// Esportazione dei componenti del webhook per chatbot
import webhookConfig from "./webhook-config.js"
import chatbotWebhookRouter from "./webhook-router.js"
import { ChatbotWebhookService } from "./webhook-service.js"

export { chatbotWebhookRouter, ChatbotWebhookService, webhookConfig }
