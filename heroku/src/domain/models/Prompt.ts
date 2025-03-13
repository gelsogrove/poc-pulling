/**
 * Modello che rappresenta un prompt per il LLM
 * Questo è un'entità di dominio che rappresenta i dati essenziali di un prompt
 */
export interface Prompt {
  /** ID univoco del prompt */
  id: string
  /** Testo del prompt da utilizzare per istruire il modello LLM */
  prompt: string
  /** Nome del modello LLM da utilizzare (es. gpt-4-0125-preview) */
  model: string
  /** Temperatura per la generazione di risposte (0.0-1.0) */
  temperature: number
  /** Tag/categorie associate al prompt (opzionale) */
  tags?: string[]
  /** Data di creazione del prompt */
  createdAt?: Date
  /** Data dell'ultimo aggiornamento del prompt */
  updatedAt?: Date
}

/**
 * Oggetto di valore che rappresenta la configurazione di un prompt
 * Versione semplificata del prompt utilizzata per le chiamate LLM
 */
export interface PromptConfig {
  /** Testo del prompt da utilizzare per istruire il modello LLM */
  prompt: string
  /** Nome del modello LLM da utilizzare */
  model: string
  /** Temperatura per la generazione di risposte (0.0-1.0) */
  temperature: number
}
