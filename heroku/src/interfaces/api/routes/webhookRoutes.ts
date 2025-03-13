import { Router } from "express"
import { WebhookController } from "../../controllers/WebhookController.js"

/**
 * Crea le rotte per il webhook
 * @param webhookController - Controller per il webhook
 * @returns Router Express con le rotte configurate
 */
export function createWebhookRoutes(
  webhookController: WebhookController
): Router {
  const router = Router()

  /**
   * Rotta GET per la verifica del webhook
   * Utilizzata dai servizi esterni per verificare l'endpoint
   */
  router.get("/", (req, res) => webhookController.verifyWebhook(req, res))

  /**
   * Rotta POST per la ricezione dei messaggi
   * Utilizzata dai servizi esterni per inviare messaggi al webhook
   */
  router.post("/", (req, res) => webhookController.receiveMessage(req, res))

  /**
   * Rotta POST per l'invio di messaggi
   * Utilizzata internamente per inviare messaggi tramite il webhook
   */
  router.post("/send", (req, res) => webhookController.sendMessage(req, res))

  return router
}
