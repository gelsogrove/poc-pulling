import { OutgoingMessage } from "../../domain/models/Message.js"
import { IMessageRepository } from "../../domain/repositories/IMessageRepository.js"
import { LoggerService } from "../../domain/services/LoggerService.js"
import { WebhookConfig } from "../../domain/valueObjects/WebhookConfig.js"

/**
 * Caso d'uso per l'invio di messaggi
 */
export class SendMessageUseCase {
  /**
   * Costruttore del caso d'uso
   * @param webhookConfig - Configurazione del webhook
   * @param messageRepository - Repository dei messaggi
   */
  constructor(
    private readonly webhookConfig: WebhookConfig,
    private readonly messageRepository: IMessageRepository
  ) {}

  /**
   * Esegue il caso d'uso per l'invio di un messaggio
   * @param message - Messaggio da inviare
   * @returns Promise con il risultato dell'invio
   */
  async execute(message: OutgoingMessage): Promise<SendMessageResult> {
    try {
      // Se il webhook è disabilitato, non inviare messaggi
      if (!this.webhookConfig.enabled) {
        LoggerService.warning("Invio messaggio fallito: webhook disabilitato")
        return {
          success: false,
          message: "Webhook disabilitato",
        }
      }

      LoggerService.info(`Invio messaggio a ${message.to}`, {
        messageText: message.text,
      })

      // Controlla se l'ID del mittente è configurato
      if (!this.webhookConfig.senderId) {
        LoggerService.error(
          "SENDER_ID non configurato. Impossibile inviare messaggi."
        )
        return {
          success: false,
          message: "SENDER_ID non configurato",
        }
      }

      // Controlla se il token di autenticazione è configurato
      if (!this.webhookConfig.bearerToken) {
        LoggerService.error(
          "BEARER_TOKEN non configurato. Impossibile inviare messaggi."
        )
        return {
          success: false,
          message: "BEARER_TOKEN non configurato",
        }
      }

      // Salva il messaggio nel repository
      await this.messageRepository.saveOutgoingMessage(message)

      // Invia il messaggio tramite il repository
      const result = await this.messageRepository.sendMessage(message)

      if (result) {
        LoggerService.info(`Messaggio inviato con successo a ${message.to}`)
        return {
          success: true,
          message: "Messaggio inviato con successo",
        }
      } else {
        LoggerService.error(`Errore nell'invio del messaggio a ${message.to}`)
        return {
          success: false,
          message: "Errore nell'invio del messaggio",
        }
      }
    } catch (error) {
      LoggerService.error(
        `Errore generale nell'invio del messaggio a ${message.to}`,
        error
      )
      return {
        success: false,
        message: "Errore interno del server",
      }
    }
  }
}

/**
 * Interfaccia per il risultato dell'invio di un messaggio
 */
export interface SendMessageResult {
  /** Indica se l'invio ha avuto successo */
  success: boolean
  /** Messaggio descrittivo del risultato */
  message: string
}
