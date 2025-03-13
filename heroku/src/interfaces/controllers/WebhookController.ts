import { Request, Response } from "express"
import { ReceiveMessageUseCase } from "../../application/useCases/ReceiveMessageUseCase.js"
import { SendMessageUseCase } from "../../application/useCases/SendMessageUseCase.js"
import { VerifyWebhookUseCase } from "../../application/useCases/VerifyWebhookUseCase.js"
import { OutgoingMessage } from "../../domain/models/Message.js"
import { LoggerService } from "../../domain/services/LoggerService.js"

/**
 * Controller per la gestione delle richieste webhook
 */
export class WebhookController {
  /**
   * Costruttore del controller
   * @param verifyWebhookUseCase - Caso d'uso per la verifica del webhook
   * @param receiveMessageUseCase - Caso d'uso per la ricezione dei messaggi
   * @param sendMessageUseCase - Caso d'uso per l'invio dei messaggi
   */
  constructor(
    private readonly verifyWebhookUseCase: VerifyWebhookUseCase,
    private readonly receiveMessageUseCase: ReceiveMessageUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase
  ) {}

  /**
   * Gestisce la verifica del webhook
   * @param req - Richiesta HTTP
   * @param res - Risposta HTTP
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    try {
      const mode = req.query["hub.mode"] as string | undefined
      const token = req.query["hub.verify_token"] as string | undefined
      const challenge = req.query["hub.challenge"] as string | undefined

      const result = this.verifyWebhookUseCase.execute(mode, token, challenge)

      if (result.isValid) {
        res.status(result.statusCode).send(result.challenge)
      } else {
        res.status(result.statusCode).json({ error: result.message })
      }
    } catch (error) {
      LoggerService.error("Errore durante la verifica del webhook", error)
      res.status(500).json({ error: "Errore interno del server" })
    }
  }

  /**
   * Gestisce la ricezione dei messaggi
   * @param req - Richiesta HTTP
   * @param res - Risposta HTTP
   */
  async receiveMessage(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.receiveMessageUseCase.execute(req.body)

      if (result.success) {
        res.status(result.statusCode).send(result.message)
      } else {
        res.status(result.statusCode).json({ error: result.message })
      }
    } catch (error) {
      LoggerService.error("Errore durante la ricezione del messaggio", error)
      res.status(500).json({ error: "Errore interno del server" })
    }
  }

  /**
   * Gestisce l'invio di un messaggio
   * @param req - Richiesta HTTP
   * @param res - Risposta HTTP
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { to, text, correlationId } = req.body

      if (!to || !text) {
        res
          .status(400)
          .json({ error: "Parametri mancanti: to e text sono obbligatori" })
        return
      }

      const message: OutgoingMessage = {
        to,
        text,
        correlationId,
      }

      const result = await this.sendMessageUseCase.execute(message)

      if (result.success) {
        res.status(200).json({ success: true, message: result.message })
      } else {
        res.status(400).json({ success: false, error: result.message })
      }
    } catch (error) {
      LoggerService.error("Errore durante l'invio del messaggio", error)
      res.status(500).json({ error: "Errore interno del server" })
    }
  }
}
