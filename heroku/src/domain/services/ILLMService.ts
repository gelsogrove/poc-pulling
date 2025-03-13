import { ConversationEntry } from "../models/Message.js"
import { PromptConfig } from "../models/Prompt.js"

/**
 * Interfaccia per il servizio di interazione con i modelli LLM
 */
export interface ILLMService {
  /**
   * Ottiene una risposta dal modello LLM
   * @param promptId - ID del prompt da utilizzare
   * @param history - Array della storia della conversazione
   * @param chatbotName - Nome del chatbot (per logging)
   * @param promptConfig - Configurazione del prompt (opzionale)
   * @returns Promise con la risposta del modello LLM
   */
  getLLMResponse(
    promptId: string,
    history: ConversationEntry[],
    chatbotName: string,
    promptConfig?: PromptConfig
  ): Promise<ConversationEntry>
}
