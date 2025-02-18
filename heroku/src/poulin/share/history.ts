import { v4 as uuidv4 } from "uuid"
import { pool } from "../../../server.js"

/**
 * Interfaccia che definisce la struttura di un messaggio nella conversazione
 */
interface Message {
  role: string // "user" o "assistant"
  content: string // contenuto del messaggio
}

/**
 * Numero massimo di messaggi da mantenere nella history
 * Limita la dimensione della conversazione per evitare problemi di performance
 */
const MAX_HISTORY_MESSAGES = 100

/**
 * Gestisce il recupero e l'aggiornamento della history di una conversazione
 *
 * @param conversationId - ID univoco della conversazione
 * @param promptId - ID del prompt utilizzato
 * @param userId - ID dell'utente
 * @param dateTime - Data e ora del messaggio
 * @param message - Nuovo messaggio da aggiungere alla history
 * @param historyString - String JSON della history (usata solo per la prima chiamata)
 * @returns Promise<Message[]> Array di messaggi per il modello, escluso l'ultimo
 */
export async function GetAndSetHistory(
  conversationId: string,
  promptId: string,
  userId: string,
  dateTime: Date,
  message: Message,
  historyString: string
): Promise<Message[]> {
  // Query per recuperare la history più recente per questa conversazione
  const existingHistoryQuery = `
    SELECT history 
    FROM conversation_history 
    WHERE idConversation = $1 
    ORDER BY datetime DESC 
    LIMIT 1
  `

  try {
    // Recupera la history esistente dal database
    const existingHistory = await pool.query(existingHistoryQuery, [
      conversationId,
    ])

    // Se esiste una history precedente, la usa invece di quella fornita
    if (existingHistory.rows.length > 0) {
      historyString = existingHistory.rows[0].history
    }

    // Converte la history da stringa JSON ad array
    let history: Message[] = []
    try {
      history = historyString ? JSON.parse(historyString) : []
    } catch (error) {
      console.error("Errore nel parsing della history:", error)
      history = []
    }

    // Aggiunge il nuovo messaggio alla history
    history.push(message)
    const updatedHistoryString = JSON.stringify(history)

    // Salva il nuovo record nel database
    await pool.query(
      `
      INSERT INTO conversation_history (
        idHistory, idUser, idPrompt, idConversation, datetime, history
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        uuidv4(),
        userId,
        promptId,
        conversationId,
        dateTime,
        updatedHistoryString,
      ]
    )

    // Applica il limite alla lunghezza della history
    if (history.length > MAX_HISTORY_MESSAGES) {
      history = history.slice(-MAX_HISTORY_MESSAGES)
    }

    // Restituisce la history senza l'ultimo messaggio
    // L'ultimo messaggio verrà aggiunto separatamente al payload della richiesta
    return history.slice(0, -1)
  } catch (error) {
    console.error("Errore nella gestione della history:", error)
    throw error
  }
}
