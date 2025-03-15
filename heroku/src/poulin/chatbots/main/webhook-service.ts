import axios from "axios"
import { Request, Response } from "express"
import { pool } from "../../../../server.js"
import { saveMessageHistory } from "../../api/history_api.js"
import { getPrompt } from "../../api/promptmanager_api.js"
import { getUserIdByPhoneNumber } from "../../services/userService.js"
import { logMessage } from "../../utility/logger.js"
import { convertToMarkdown } from "../../utils/markdownConverter.js"
import { getLLMResponse } from "./getLLMresponse.js"
import webhookConfig from "./webhook-config.js"

// Interfaccia per il messaggio WhatsApp
export interface WhatsAppMessage {
  from: string
  text: {
    body: string
  }
  timestamp: number
  id: string
}

// Interfaccia per il messaggio in uscita
export interface OutgoingMessage {
  to: string
  text: string
  correlationId?: string
}

// Interfaccia per la risposta del chatbot
interface ChatbotResponse {
  content: string
  target?: ValidTarget
}

// Interfaccia per la configurazione del target
interface TargetConfig {
  promptId: number
}

// Mappa dei target validi
type ValidTarget = "sales" | "support" | "general" | "products" | string

// Mappa delle configurazioni dei target
const targetConfigs: Record<ValidTarget, TargetConfig> = {
  sales: { promptId: 2 },
  support: { promptId: 3 },
  general: { promptId: 4 },
}

// Interfaccia per la risposta del LLM
interface LLMResponse {
  content: string
}

// Interfaccia per i parametri del LLM
interface LLMParams {
  prompt: string
  model: string
  temperature: number
}

// Classe per gestire i log con timestamp
class Logger {
  static log(type: string, message: string, details?: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [WEBHOOK] [${type}]: ${message}`)
    if (details) {
      console.log(JSON.stringify(details, null, 2))
    }
  }
}

/**
 * Servizio webhook per la chatbot
 */
export class ChatbotWebhookService {
  private static readonly MAIN_PROMPT_ID: number = 1 // Main prompt ID come numero

  /**
   * Verifica la richiesta di webhooks in arrivo
   */
  static async verifyWebhook(
    req: Request,
    res: Response
  ): Promise<void | Response> {
    // Se il webhook è disabilitato, restituisci un errore
    if (!webhookConfig.enabled) {
      Logger.log("VERIFY", "Webhook disabilitato")
      return res.status(403).json({ error: "Webhook disabilitato" })
    }

    const mode = req.query["hub.mode"]
    const token = req.query["hub.verify_token"]
    const challenge = req.query["hub.challenge"]

    if (mode === "subscribe" && token === webhookConfig.verifyToken) {
      Logger.log("VERIFY", "Webhook verificato con successo")
      return res.status(200).send(challenge)
    }

    Logger.log("VERIFY", "Verifica webhook fallita")
    return res.status(403).json({ error: "Verifica fallita" })
  }

  /**
   * Gestisce i messaggi in arrivo dal webhook
   */
  static async receiveMessage(
    message: WhatsAppMessage
  ): Promise<ChatbotResponse> {
    try {
      Logger.log("RECEIVE", "Messaggio ricevuto", message)

      // Estrai il numero di telefono dal messaggio WhatsApp
      const phoneNumber = message.from

      // Verifica se l'utente esiste e ottieni userId o crea nuovo utente
      const userId = await getUserIdByPhoneNumber(phoneNumber)

      // Recupera il contenuto del messaggio
      const messageContent = message.text?.body || ""

      // Processa con il chatbot principale per determinare il routing
      const routingResult = await this.processWithMainChatbot(messageContent)

      // Routing al sub-chatbot appropriato basato sulla risposta del chatbot principale
      const finalResponse = await this.routeToSubChatbot(
        routingResult.target || "general",
        messageContent,
        userId
      )

      // Salva nella cronologia
      await saveMessageHistory(userId, messageContent, finalResponse.content)

      // Restituisci la risposta in formato markdown
      return {
        content: convertToMarkdown(finalResponse.content),
        target: finalResponse.target,
      }
    } catch (error) {
      Logger.log(
        "ERROR",
        "Errore nell'elaborazione del messaggio WhatsApp",
        error
      )
      throw error
    }
  }

  private static async processWithMainChatbot(
    message: string
  ): Promise<ChatbotResponse> {
    try {
      logMessage("INFO", "Iniziando il processing con il chatbot principale")

      // 1. Ottieni il prompt Main - convertendo l'ID in numero
      const mainPromptData = await getPrompt(this.MAIN_PROMPT_ID)
      if (!mainPromptData) {
        throw new Error("Prompt Main non trovato")
      }

      // 2. Ottieni la prima risposta dal Main chatbot
      logMessage("INFO", "Ottenendo risposta dal Main chatbot")
      const mainResponse = await getLLMResponse(message, mainPromptData)

      // 3. Determina il target chatbot dalla risposta
      const target = this.determineTarget(mainResponse.content)
      logMessage("INFO", `Target determinato: ${target}`)

      if (!target) {
        // Se non c'è un target, restituisci direttamente la risposta del Main
        return {
          content: mainResponse.content,
        }
      }

      // 4. Ottieni il prompt del target
      const targetPromptData = await this.getTargetPrompt(target)
      if (!targetPromptData) {
        throw new Error(`Prompt ${target} non trovato`)
      }

      // 5. Processa il messaggio con il target chatbot
      logMessage("INFO", `Processando messaggio con ${target} chatbot`)
      const targetResponse = await getLLMResponse(message, targetPromptData)

      // 6. Invia la risposta del target al Main per il formatting finale
      logMessage("INFO", "Formattando risposta finale con Main chatbot")
      const finalResponse = await getLLMResponse(
        `Formatta questa risposta in markdown: ${targetResponse.content}`,
        mainPromptData
      )

      return {
        content: finalResponse.content,
        target,
      }
    } catch (error) {
      logMessage("ERROR", "Errore nel processing del chatbot principale", error)
      throw error
    }
  }

  private static async getTargetPrompt(target: ValidTarget): Promise<any> {
    try {
      const result = await pool.query(
        "SELECT idprompt FROM prompts WHERE path = $1",
        [target]
      )
      if (result.rows.length === 0) {
        return null
      }
      const promptId = parseInt(result.rows[0].idprompt, 10)
      return await getPrompt(promptId)
    } catch (error) {
      logMessage("ERROR", `Errore nel recupero del prompt ${target}`, error)
      return null
    }
  }

  private static determineTarget(content: string): ValidTarget | undefined {
    try {
      const response = JSON.parse(content)
      return response.target as ValidTarget
    } catch {
      return undefined
    }
  }

  private static async routeToSubChatbot(
    target: ValidTarget,
    message: string,
    userId: string
  ): Promise<ChatbotResponse> {
    try {
      // Ottieni la configurazione del target
      const targetConfig = targetConfigs[target]

      if (!targetConfig) {
        throw new Error(`Configurazione non trovata per il target ${target}`)
      }

      // Ottieni il prompt specifico per il target
      const promptData = await getPrompt(targetConfig.promptId)

      if (!promptData) {
        throw new Error(`Prompt non trovato per il target ${target}`)
      }

      // Ottieni la risposta dal modello
      const response = await getLLMResponse(message, promptData)

      return {
        content: response.content,
        target: target,
      }
    } catch (error) {
      Logger.log("ERROR", "Errore nel routing al sub-chatbot", error)
      throw error
    }
  }

  /**
   * Invia un messaggio tramite l'API del webhook
   */
  static async sendMessage(message: OutgoingMessage): Promise<boolean> {
    // Se il webhook è disabilitato, non inviare messaggi
    if (!webhookConfig.enabled) {
      Logger.log("SEND", "Invio messaggio fallito: webhook disabilitato")
      return false
    }

    try {
      Logger.log("SENDING", `Invio messaggio a ${message.to}`, {
        messageText: message.text,
      })

      // Costruisce la struttura del messaggio
      const payload = {
        messaging_product: "general",
        recipient_type: "individual",
        to: message.to,
        type: "text",
        text: {
          body: message.text,
        },
        metadata: {
          correlation_id: message.correlationId,
        },
      }

      // Invia il messaggio all'API
      const response = await axios.post(
        `${webhookConfig.apiUrl}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${webhookConfig.bearerToken}`,
            "Content-Type": "application/json",
          },
        }
      )

      Logger.log("SENT", `Messaggio inviato con successo a ${message.to}`, {
        statusCode: response.status,
        responseData: response.data,
      })

      return true
    } catch (error) {
      Logger.log(
        "ERROR",
        `Errore nell'invio del messaggio a ${message.to}`,
        error
      )
      return false
    }
  }
}
