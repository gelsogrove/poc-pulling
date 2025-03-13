import { IncomingMessage, OutgoingMessage } from "../models/Message.js"

/**
 * Interfaccia per il repository dei messaggi
 * Definisce le operazioni possibili sui messaggi
 */
export interface IMessageRepository {
  /**
   * Salva un messaggio in entrata nel repository
   * @param message - Messaggio in entrata da salvare
   * @returns Promise con l'ID del messaggio salvato
   */
  saveIncomingMessage(message: IncomingMessage): Promise<string>

  /**
   * Salva un messaggio in uscita nel repository
   * @param message - Messaggio in uscita da salvare
   * @returns Promise con l'ID del messaggio salvato
   */
  saveOutgoingMessage(message: OutgoingMessage): Promise<string>

  /**
   * Invia un messaggio tramite il provider esterno
   * @param message - Messaggio da inviare
   * @returns Promise con il risultato dell'invio (true se ha avuto successo)
   */
  sendMessage(message: OutgoingMessage): Promise<boolean>

  /**
   * Recupera la cronologia dei messaggi per un determinato mittente
   * @param senderId - ID del mittente
   * @param limit - Numero massimo di messaggi da recuperare
   * @returns Promise con l'array dei messaggi trovati
   */
  getHistoryBySender(
    senderId: string,
    limit?: number
  ): Promise<Array<IncomingMessage | OutgoingMessage>>
}
