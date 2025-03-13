import { ReceiveMessageUseCase } from "../../application/useCases/ReceiveMessageUseCase.js"
import { SendMessageUseCase } from "../../application/useCases/SendMessageUseCase.js"
import { VerifyWebhookUseCase } from "../../application/useCases/VerifyWebhookUseCase.js"
import { LoggerService } from "../../domain/services/LoggerService.js"
import { WebhookController } from "../../interfaces/controllers/WebhookController.js"
import { getDatabasePool } from "../database/database.js"
import { MessageRepository } from "../repositories/MessageRepository.js"
import { PromptRepository } from "../repositories/PromptRepository.js"
import { LLMService } from "../services/LLMService.js"
import { WebhookConfigService } from "../services/WebhookConfigService.js"

/**
 * Configurazione delle dipendenze dell'applicazione
 * Implementa il pattern Dependency Injection
 */
export class DependencyInjection {
  /**
   * Configura le dipendenze e restituisce il controller del webhook
   * @returns Controller del webhook configurato
   */
  static async configureWebhookController(): Promise<WebhookController> {
    try {
      LoggerService.info("Configurazione delle dipendenze...")

      // Carica la configurazione del webhook
      const webhookConfig = WebhookConfigService.loadConfig()

      // Ottieni il pool di connessione al database
      const databasePool = await getDatabasePool()

      // Crea i repository
      const promptRepository = new PromptRepository(databasePool)
      const messageRepository = new MessageRepository(
        databasePool,
        webhookConfig
      )

      // Crea il servizio LLM
      const llmService = new LLMService(
        process.env.OPENAI_API_KEY || "",
        promptRepository
      )

      // Crea i casi d'uso
      const verifyWebhookUseCase = new VerifyWebhookUseCase(webhookConfig)
      const receiveMessageUseCase = new ReceiveMessageUseCase(
        webhookConfig,
        messageRepository,
        llmService
      )
      const sendMessageUseCase = new SendMessageUseCase(
        webhookConfig,
        messageRepository
      )

      // Crea il controller
      const webhookController = new WebhookController(
        verifyWebhookUseCase,
        receiveMessageUseCase,
        sendMessageUseCase
      )

      LoggerService.info("Dipendenze configurate con successo")

      return webhookController
    } catch (error) {
      LoggerService.error("Errore nella configurazione delle dipendenze", error)
      throw error
    }
  }
}
