import express, { Request, Response } from "express"
import { v4 as uuidv4 } from "uuid"
import { pool } from "../../../server.js"

/**
 * Interfaccia che definisce la struttura di un messaggio nella conversazione
 */
interface Message {
  role: string // "user" o "assistant"
  content: string // contenuto del messaggio
  chatbot?: string
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
    SELECT history, idhistory 
    FROM conversation_history 
    WHERE idConversation = $1
    LIMIT 1
  `

  try {
    // Recupera la history esistente dal database
    const existingHistory = await pool.query(existingHistoryQuery, [
      conversationId,
    ])

    let history: Message[] = []
    let existingHistoryId: string | null = null

    // Se esiste una history precedente, la usa invece di quella fornita
    if (existingHistory.rows.length > 0) {
      historyString = existingHistory.rows[0].history
      existingHistoryId = existingHistory.rows[0].idhistory
    }

    // Converte la history da stringa JSON ad array
    try {
      history = historyString ? JSON.parse(historyString) : []
    } catch (error) {
      console.error("Errore nel parsing della history:", error)
      history = []
    }

    // Aggiunge il nuovo messaggio alla history
    history.push(message)
    const updatedHistoryString = JSON.stringify(history)

    if (existingHistoryId) {
      // Se la conversazione esiste, aggiorna il record esistente
      await pool.query(
        `
        UPDATE conversation_history 
        SET history = $1, datetime = $2
        WHERE idHistory = $3
        `,
        [updatedHistoryString, dateTime, existingHistoryId]
      )
    } else {
      // Se è una nuova conversazione, crea un nuovo record
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
    }

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

/**
 * Recupera la cronologia delle chat per una conversazione specifica.
 *
 * @param idConversation - ID della conversazione
 * @param idPrompt - ID del prompt
 * @param idUser - ID dell'utente
 * @returns Promise<any> - La cronologia delle chat
 */
export async function GetHistoryChats(idPrompt: string): Promise<any> {
  const query = `
    SELECT datetime,idhistory,history
    FROM conversation_history
    WHERE idPrompt = $1 
    ORDER BY datetime DESC
  `

  try {
    const result = await pool.query(query, [idPrompt])
    if (result.rows.length > 0) {
      return result.rows
    } else {
      return null
    }
  } catch (error) {
    console.error("Errore nel recupero della cronologia delle chat:", error)
    throw error
  }
}

/**
 * Elimina una cronologia specifica.
 *
 * @param idHistory - ID della cronologia da eliminare
 * @returns Promise<boolean> - Indica se l'eliminazione è avvenuta con successo
 */
export async function DeleteHistory(idHistory: string): Promise<boolean> {
  const query = `
    DELETE FROM conversation_history
    WHERE idHistory = $1
  `

  try {
    const result = await pool.query(query, [idHistory])
    return result?.rowCount ? result.rowCount > 0 : false
  } catch (error) {
    console.error("Errore nell'eliminazione della cronologia:", error)
    throw error
  }
}

const historyRouter = express.Router()

// Metodo di gestione per impostare la cronologia
async function handleSetHistory(req: Request, res: Response) {
  const { conversationId, promptId, userId, dateTime, message, historyString } =
    req.body
  try {
    const history = await GetAndSetHistory(
      conversationId,
      promptId,
      userId,
      dateTime,
      message,
      historyString
    )
    res.status(200).json(history)
  } catch (error) {
    res.status(500).json({ error: "Errore nella gestione della history" })
  }
}

// Metodo di gestione per recuperare la cronologia delle chat
async function handleGetHistoryChats(req: Request, res: Response) {
  const { idPrompt } = req.query
  try {
    const history = await GetHistoryChats(idPrompt as string)
    res.status(200).json(history)
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nel recupero della cronologia delle chat" })
  }
}

// Metodo di gestione per eliminare una cronologia
async function handleDeleteHistory(req: Request, res: Response) {
  const { idHistory } = req.params
  try {
    const success = await DeleteHistory(idHistory)
    if (success) {
      res.status(200).json({ message: "Cronologia eliminata con successo" })
    } else {
      res.status(404).json({ error: "Cronologia non trovata" })
    }
  } catch (error) {
    res.status(500).json({ error: "Errore nell'eliminazione della cronologia" })
  }
}

// Collegamento dei metodi di gestione agli endpoint
historyRouter.post("/set", handleSetHistory)
historyRouter.get("/chats", handleGetHistoryChats)
historyRouter.delete("/delete/:idHistory", handleDeleteHistory)

export default historyRouter
