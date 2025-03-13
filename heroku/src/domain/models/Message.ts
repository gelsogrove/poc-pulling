/**
 * Modello che rappresenta un messaggio in entrata nel sistema
 * Questo è un'entità di dominio che rappresenta i dati essenziali di un messaggio
 */
export interface IncomingMessage {
  /** ID univoco del mittente */
  from: string
  /** Contenuto testuale del messaggio */
  text: string
  /** Timestamp di ricezione del messaggio (in millisecondi) */
  timestamp: number
  /** ID univoco del messaggio */
  messageId: string
}

/**
 * Modello che rappresenta un messaggio in uscita dal sistema
 * Questo è un'entità di dominio che rappresenta i dati essenziali di un messaggio da inviare
 */
export interface OutgoingMessage {
  /** ID univoco del destinatario */
  to: string
  /** Contenuto testuale del messaggio */
  text: string
  /** ID di correlazione per tracciare la conversazione (opzionale) */
  correlationId?: string
}

/**
 * Modello che rappresenta una voce di conversazione nella cronologia
 */
export interface ConversationEntry {
  /** Ruolo del partecipante ('user' o 'assistant') */
  role: "user" | "assistant"
  /** Contenuto del messaggio */
  content: string
}
