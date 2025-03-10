// Configurazione del webhook per il chatbot
import dotenv from "dotenv"

dotenv.config()

// Configurazione del webhook
export interface WebhookConfig {
  // Abilita o disabilita il webhook
  enabled: boolean
  // Token di verifica per la sicurezza del webhook
  verifyToken: string
  // Bearer token per l'autenticazione alle API esterne
  bearerToken: string
  // URL base delle API
  apiUrl: string
  // ID del mittente per i messaggi in uscita
  senderId: string
}

// Configurazione di default, può essere sovrascritta con variabili d'ambiente
const webhookConfig: WebhookConfig = {
  // Il webhook è disabilitato di default, deve essere abilitato esplicitamente
  enabled: process.env.CHATBOT_WEBHOOK_ENABLED === "true",
  // Token usato per verificare le richieste in entrata
  verifyToken:
    process.env.CHATBOT_WEBHOOK_VERIFY_TOKEN || "chatbot-webhook-token",
  // Token per l'autenticazione alle API esterne
  bearerToken: process.env.CHATBOT_WEBHOOK_BEARER_TOKEN || "",
  // URL base per le API esterne
  apiUrl: process.env.CHATBOT_WEBHOOK_API_URL || "https://api.example.com/v1",
  // ID del mittente per l'invio dei messaggi
  senderId: process.env.CHATBOT_WEBHOOK_SENDER_ID || "",
}

export default webhookConfig
