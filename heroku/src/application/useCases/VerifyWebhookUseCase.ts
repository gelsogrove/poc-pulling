import { LoggerService } from "../../domain/services/LoggerService.js"
import { WebhookConfig } from "../../domain/valueObjects/WebhookConfig.js"

/**
 * Caso d'uso per la verifica del webhook
 * Gestisce la logica di verifica delle richieste in entrata
 */
export class VerifyWebhookUseCase {
  /**
   * Costruttore del caso d'uso
   * @param webhookConfig - Configurazione del webhook
   */
  constructor(private readonly webhookConfig: WebhookConfig) {}

  /**
   * Verifica una richiesta di webhook in arrivo
   * @param mode - Modalità della richiesta
   * @param token - Token di verifica
   * @param challenge - Challenge da restituire in caso di successo
   * @returns Oggetto con il risultato della verifica
   */
  execute(
    mode?: string,
    token?: string,
    challenge?: string
  ): VerifyWebhookResult {
    // Se il webhook è disabilitato, restituisci un errore
    if (!this.webhookConfig.enabled) {
      LoggerService.warning("Webhook disabilitato")
      return {
        isValid: false,
        statusCode: 403,
        message: "Webhook disabilitato",
        challenge: undefined,
      }
    }

    // Verifica che i parametri necessari siano presenti
    if (!mode || !token) {
      LoggerService.warning("Verifica fallita: parametri mancanti")
      return {
        isValid: false,
        statusCode: 400,
        message: "Parametri mancanti",
        challenge: undefined,
      }
    }

    // Verifica che la modalità e il token siano corretti
    if (mode === "subscribe" && token === this.webhookConfig.verifyToken) {
      LoggerService.info("Webhook verificato con successo")
      return {
        isValid: true,
        statusCode: 200,
        message: "Webhook verificato con successo",
        challenge: challenge,
      }
    }

    // Se la verifica fallisce, registra l'errore
    LoggerService.warning("Verifica fallita: token non valido", {
      receivedToken: token,
      expectedToken: this.webhookConfig.verifyToken,
    })

    return {
      isValid: false,
      statusCode: 403,
      message: "Token non valido",
      challenge: undefined,
    }
  }
}

/**
 * Interfaccia per il risultato della verifica del webhook
 */
export interface VerifyWebhookResult {
  /** Indica se la verifica ha avuto successo */
  isValid: boolean
  /** Codice di stato HTTP da restituire */
  statusCode: number
  /** Messaggio descrittivo del risultato */
  message: string
  /** Challenge da restituire in caso di successo */
  challenge?: string
}
