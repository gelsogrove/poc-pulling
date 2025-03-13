import dotenv from "dotenv"
import { LoggerService } from "../../domain/services/LoggerService.js"
import {
  WebhookConfig,
  createWebhookConfig,
} from "../../domain/valueObjects/WebhookConfig.js"

// Carica le variabili d'ambiente
dotenv.config()

/**
 * Servizio per la gestione della configurazione del webhook
 * Carica la configurazione dalle variabili d'ambiente
 */
export class WebhookConfigService {
  /**
   * Carica la configurazione del webhook dalle variabili d'ambiente
   * @returns Configurazione del webhook
   */
  static loadConfig(): WebhookConfig {
    const enabled = process.env.CHATBOT_WEBHOOK_ENABLED === "true"
    const verifyToken = process.env.CHATBOT_WEBHOOK_VERIFY_TOKEN || ""
    const bearerToken = process.env.CHATBOT_WEBHOOK_BEARER_TOKEN || ""
    const apiUrl = process.env.CHATBOT_WEBHOOK_API_URL || ""
    const senderId = process.env.CHATBOT_WEBHOOK_SENDER_ID || ""

    const config = createWebhookConfig({
      enabled,
      verifyToken,
      bearerToken,
      apiUrl,
      senderId,
    })

    // Log della configurazione (senza esporre il token)
    LoggerService.info("Configurazione webhook caricata", {
      enabled: config.enabled,
      apiUrl: config.apiUrl,
      senderId: config.senderId,
      verifyTokenConfigured: !!config.verifyToken,
      bearerTokenConfigured: !!config.bearerToken,
    })

    return config
  }

  /**
   * Verifica se la configurazione del webhook è valida
   * @param config - Configurazione del webhook da validare
   * @returns true se la configurazione è valida, false altrimenti
   */
  static isConfigValid(config: WebhookConfig): boolean {
    if (!config.enabled) {
      return true // Se disabilitato, è sempre valido
    }

    // Se abilitato, verifica che tutti i campi necessari siano presenti
    const isValid =
      !!config.verifyToken &&
      !!config.bearerToken &&
      !!config.apiUrl &&
      !!config.senderId

    if (!isValid) {
      LoggerService.warning("Configurazione webhook non valida", {
        verifyTokenMissing: !config.verifyToken,
        bearerTokenMissing: !config.bearerToken,
        apiUrlMissing: !config.apiUrl,
        senderIdMissing: !config.senderId,
      })
    }

    return isValid
  }
}
