import axios from "axios"
import { Pool } from "pg"
import {
  IncomingMessage,
  OutgoingMessage,
} from "../../domain/models/Message.js"
import { IMessageRepository } from "../../domain/repositories/IMessageRepository.js"
import { LoggerService } from "../../domain/services/LoggerService.js"
import { WebhookConfig } from "../../domain/valueObjects/WebhookConfig.js"

/**
 * Implementazione del repository dei messaggi
 * Gestisce la persistenza e l'invio dei messaggi
 */
export class MessageRepository implements IMessageRepository {
  /**
   * Costruttore del repository dei messaggi
   * @param pool - Pool di connessione al database
   * @param webhookConfig - Configurazione del webhook
   */
  constructor(
    private readonly pool: Pool,
    private readonly webhookConfig: WebhookConfig
  ) {}

  /**
   * Salva un messaggio in entrata nel repository
   * @param message - Messaggio in entrata da salvare
   * @returns Promise con l'ID del messaggio salvato
   */
  async saveIncomingMessage(message: IncomingMessage): Promise<string> {
    try {
      // Implementazione della persistenza del messaggio in entrata
      // Questa è una versione semplificata che potrebbe essere espansa in futuro
      LoggerService.info(`Salvataggio messaggio in entrata da ${message.from}`)

      // Qui potrebbe esserci la logica per salvare il messaggio nel database
      // Per ora, restituiamo semplicemente l'ID del messaggio
      return message.messageId
    } catch (error) {
      LoggerService.error(
        "Errore nel salvataggio del messaggio in entrata",
        error
      )
      throw error
    }
  }

  /**
   * Salva un messaggio in uscita nel repository
   * @param message - Messaggio in uscita da salvare
   * @returns Promise con l'ID del messaggio salvato
   */
  async saveOutgoingMessage(message: OutgoingMessage): Promise<string> {
    try {
      // Implementazione della persistenza del messaggio in uscita
      // Questa è una versione semplificata che potrebbe essere espansa in futuro
      LoggerService.info(`Salvataggio messaggio in uscita per ${message.to}`)

      // Qui potrebbe esserci la logica per salvare il messaggio nel database
      // Per ora, restituiamo un ID generato
      return `outgoing-${Date.now()}`
    } catch (error) {
      LoggerService.error(
        "Errore nel salvataggio del messaggio in uscita",
        error
      )
      throw error
    }
  }

  /**
   * Invia un messaggio tramite il provider esterno
   * @param message - Messaggio da inviare
   * @returns Promise con il risultato dell'invio (true se ha avuto successo)
   */
  async sendMessage(message: OutgoingMessage): Promise<boolean> {
    try {
      LoggerService.info(`Invio messaggio a ${message.to}`, {
        messageText: message.text,
      })

      // Controlla se l'ID del mittente è configurato
      if (!this.webhookConfig.senderId) {
        LoggerService.error(
          "SENDER_ID non configurato. Impossibile inviare messaggi."
        )
        return false
      }

      // Controlla se il token di autenticazione è configurato
      if (!this.webhookConfig.bearerToken) {
        LoggerService.error(
          "BEARER_TOKEN non configurato. Impossibile inviare messaggi."
        )
        return false
      }

      // Costruisce la struttura del messaggio per WhatsApp
      const payload = {
        messaging_product: "whatsapp", // Deve essere esattamente "whatsapp"
        recipient_type: "individual", // Tipo di destinatario
        to: message.to, // Numero di telefono del destinatario
        type: "text", // Tipo di messaggio
        text: {
          preview_url: false, // Non mostrare anteprima URL
          body: message.text, // Corpo del messaggio
        },
      }

      // Costruisce l'URL completo dell'API WhatsApp
      const apiUrl = `${this.webhookConfig.apiUrl}/${this.webhookConfig.senderId}/messages`

      // Log dei dettagli della richiesta per debug
      LoggerService.debug(`Invio richiesta a: ${apiUrl}`)
      LoggerService.debug(`Payload: ${JSON.stringify(payload)}`)
      LoggerService.debug(`Configurazione webhook:`, {
        enabled: this.webhookConfig.enabled,
        apiUrl: this.webhookConfig.apiUrl,
        senderId: this.webhookConfig.senderId,
        tokenConfigured: !!this.webhookConfig.bearerToken,
      })

      // Invia il messaggio all'API
      try {
        const response = await axios.post(apiUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.webhookConfig.bearerToken}`,
            "Content-Type": "application/json",
          },
        })

        LoggerService.info(`Messaggio inviato con successo a ${message.to}`, {
          statusCode: response.status,
          responseData: response.data,
        })

        return true
      } catch (axiosError: any) {
        // Log dettagliato dell'errore Axios
        LoggerService.error("Errore nella richiesta API WhatsApp:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message,
          request: {
            url: apiUrl,
            payload,
          },
        })

        return false
      }
    } catch (error) {
      LoggerService.error(
        `Errore generale nell'invio del messaggio a ${message.to}`,
        error
      )
      return false
    }
  }

  /**
   * Recupera la cronologia dei messaggi per un determinato mittente
   * @param senderId - ID del mittente
   * @param limit - Numero massimo di messaggi da recuperare
   * @returns Promise con l'array dei messaggi trovati
   */
  async getHistoryBySender(
    senderId: string,
    limit: number = 10
  ): Promise<Array<IncomingMessage | OutgoingMessage>> {
    try {
      // Implementazione del recupero della cronologia dei messaggi
      // Questa è una versione semplificata che potrebbe essere espansa in futuro
      LoggerService.info(
        `Recupero cronologia messaggi per ${senderId} (limite: ${limit})`
      )

      // Qui potrebbe esserci la logica per recuperare i messaggi dal database
      // Per ora, restituiamo un array vuoto
      return []
    } catch (error) {
      LoggerService.error(
        `Errore nel recupero della cronologia per ${senderId}`,
        error
      )
      throw error
    }
  }
}
