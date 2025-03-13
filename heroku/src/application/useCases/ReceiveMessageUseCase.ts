import {
  IncomingMessage,
  OutgoingMessage,
} from "../../domain/models/Message.js"
import { IMessageRepository } from "../../domain/repositories/IMessageRepository.js"
import { ILLMService } from "../../domain/services/ILLMService.js"
import { LoggerService } from "../../domain/services/LoggerService.js"
import { WebhookConfig } from "../../domain/valueObjects/WebhookConfig.js"

/**
 * Caso d'uso per la ricezione e l'elaborazione dei messaggi
 */
export class ReceiveMessageUseCase {
  /**
   * Costruttore del caso d'uso
   * @param webhookConfig - Configurazione del webhook
   * @param messageRepository - Repository dei messaggi
   * @param llmService - Servizio LLM
   */
  constructor(
    private readonly webhookConfig: WebhookConfig,
    private readonly messageRepository: IMessageRepository,
    private readonly llmService: ILLMService
  ) {}

  /**
   * Estrae un messaggio dal payload ricevuto
   * @param payload - Payload ricevuto dal webhook
   * @returns Messaggio estratto o null se non è stato possibile estrarre un messaggio valido
   */
  extractMessageFromPayload(payload: any): IncomingMessage | null {
    try {
      // Log completo del payload per debug
      LoggerService.debug("Payload ricevuto:", payload)

      // Formato standard di WhatsApp Cloud API per messaggi di testo
      if (
        payload.object === "whatsapp_business_account" &&
        payload.entry &&
        payload.entry[0]?.changes &&
        payload.entry[0].changes[0]?.value?.messages &&
        payload.entry[0].changes[0].value.messages[0]
      ) {
        const messageData = payload.entry[0].changes[0].value.messages[0]

        // Log dei dettagli del messaggio per debug
        LoggerService.debug("Dati del messaggio estratti:", messageData)

        // Messaggio di testo
        if (messageData.type === "text" && messageData.text) {
          LoggerService.info(
            `Messaggio di testo ricevuto da ${messageData.from}: ${messageData.text.body}`
          )
          return {
            from: messageData.from,
            text: messageData.text.body || "",
            timestamp: parseInt(messageData.timestamp) || Date.now(),
            messageId: messageData.id,
          }
        }

        // Messaggio interattivo (bottoni)
        if (messageData.type === "interactive" && messageData.interactive) {
          let text = ""

          // Gestisci diversi tipi di interazioni
          if (messageData.interactive.button_reply) {
            text = `Ho selezionato: ${messageData.interactive.button_reply.title}`
          } else if (messageData.interactive.list_reply) {
            text = `Ho selezionato: ${messageData.interactive.list_reply.title}`
          }

          LoggerService.info(
            `Messaggio interattivo ricevuto da ${messageData.from}: ${text}`
          )
          return {
            from: messageData.from,
            text: text,
            timestamp: parseInt(messageData.timestamp) || Date.now(),
            messageId: messageData.id,
          }
        }

        // Log per tipo di messaggio non gestito
        LoggerService.warning(
          `Tipo di messaggio non gestito: ${messageData.type}`,
          messageData
        )
      }

      // Formato alternativo
      if (payload.message && payload.sender) {
        LoggerService.info(
          `Messaggio in formato alternativo ricevuto da ${payload.sender.id}: ${
            payload.message.text || ""
          }`
        )
        return {
          from: payload.sender.id,
          text: payload.message.text || "",
          timestamp: payload.timestamp || Date.now(),
          messageId: payload.message.mid,
        }
      }

      LoggerService.warning(
        "Nessun formato di messaggio riconosciuto nel payload"
      )
      return null
    } catch (error) {
      LoggerService.error("Errore nell'estrazione del messaggio", error)
      return null
    }
  }

  /**
   * Verifica se il payload è una notifica di stato
   * @param payload - Payload ricevuto dal webhook
   * @returns true se è una notifica di stato, false altrimenti
   */
  isStatusNotification(payload: any): boolean {
    return (
      payload?.object === "whatsapp_business_account" &&
      payload?.entry &&
      payload.entry[0]?.changes &&
      payload.entry[0].changes[0]?.value?.statuses
    )
  }

  /**
   * Elabora un messaggio ricevuto
   * @param message - Messaggio da elaborare
   * @returns Promise che si risolve quando il messaggio è stato elaborato
   */
  async processMessage(message: IncomingMessage): Promise<void> {
    try {
      LoggerService.info(`Elaborazione messaggio da ${message.from}`, message)

      // Salva il messaggio in entrata
      await this.messageRepository.saveIncomingMessage(message)

      // ID del prompt da utilizzare
      const promptId = "default-chatbot-prompt"

      // Storia vuota per un messaggio singolo
      const history = [{ role: "user" as const, content: message.text }]

      // Nome del chatbot per il logging
      const chatbotName = "webhook-chatbot"

      // Usa un prompt predefinito invece di cercarlo nel database
      const cachedPromptData = {
        prompt:
          "Sei Eva, un'assistente virtuale utile e amichevole che risponde in italiano. Fornisci risposte chiare e concise alle domande degli utenti.",
        model: "gpt-4-0125-preview",
        temperature: 0.7,
      }

      // Ottiene la risposta dal modello di IA passando il prompt predefinito
      const llmResponse = await this.llmService.getLLMResponse(
        promptId,
        history,
        chatbotName,
        cachedPromptData
      )

      // Estrae il testo della risposta
      const responseText =
        typeof llmResponse.content === "string"
          ? llmResponse.content
          : JSON.stringify(llmResponse.content)

      // Crea il messaggio di risposta
      const outgoingMessage: OutgoingMessage = {
        to: message.from,
        text: responseText,
        correlationId: message.messageId,
      }

      // Salva il messaggio in uscita
      await this.messageRepository.saveOutgoingMessage(outgoingMessage)

      // Invia la risposta all'utente
      await this.messageRepository.sendMessage(outgoingMessage)

      LoggerService.info(`Messaggio elaborato per ${message.from}`)
    } catch (error) {
      LoggerService.error(
        `Errore nell'elaborazione del messaggio per ${message.from}`,
        error
      )
      throw error
    }
  }

  /**
   * Esegue il caso d'uso per la ricezione di un messaggio
   * @param payload - Payload ricevuto dal webhook
   * @returns Risultato dell'elaborazione del messaggio
   */
  async execute(payload: any): Promise<ReceiveMessageResult> {
    try {
      // Se il webhook è disabilitato, restituisci un errore
      if (!this.webhookConfig.enabled) {
        LoggerService.warning("Webhook disabilitato")
        return {
          success: false,
          statusCode: 403,
          message: "Webhook disabilitato",
        }
      }

      // Verifica se si tratta di una notifica di stato
      if (this.isStatusNotification(payload)) {
        LoggerService.info("Ricevuta notifica di stato del messaggio, ignorata")
        return {
          success: true,
          statusCode: 200,
          message: "OK",
        }
      }

      // Estrae il messaggio dal payload
      const message = this.extractMessageFromPayload(payload)

      // Se non è stato possibile estrarre un messaggio valido
      if (!message) {
        LoggerService.warning("Nessun messaggio valido trovato nella richiesta")
        return {
          success: false,
          statusCode: 400,
          message: "Nessun messaggio valido trovato nella richiesta",
        }
      }

      // Processa il messaggio
      await this.processMessage(message)

      // Risponde con OK
      return {
        success: true,
        statusCode: 200,
        message: "OK",
      }
    } catch (error) {
      LoggerService.error("Errore durante la ricezione del messaggio", error)
      return {
        success: false,
        statusCode: 500,
        message: "Errore interno del server",
      }
    }
  }
}

/**
 * Interfaccia per il risultato della ricezione di un messaggio
 */
export interface ReceiveMessageResult {
  /** Indica se l'elaborazione ha avuto successo */
  success: boolean
  /** Codice di stato HTTP da restituire */
  statusCode: number
  /** Messaggio descrittivo del risultato */
  message: string
}
