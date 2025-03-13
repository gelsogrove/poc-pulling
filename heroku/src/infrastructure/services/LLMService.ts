import axios from "axios"
import { ConversationEntry } from "../../domain/models/Message.js"
import { PromptConfig } from "../../domain/models/Prompt.js"
import { IPromptRepository } from "../../domain/repositories/IPromptRepository.js"
import { ILLMService } from "../../domain/services/ILLMService.js"
import { LoggerService } from "../../domain/services/LoggerService.js"

/**
 * Implementazione del servizio LLM che utilizza OpenAI
 */
export class LLMService implements ILLMService {
  /**
   * Costruttore del servizio LLM
   * @param apiKey - Chiave API per OpenAI
   * @param promptRepository - Repository dei prompt (opzionale)
   */
  constructor(
    private readonly apiKey: string,
    private readonly promptRepository?: IPromptRepository
  ) {}

  /**
   * Ottiene una risposta dal modello LLM
   * @param promptId - ID del prompt da utilizzare
   * @param history - Array della storia della conversazione
   * @param chatbotName - Nome del chatbot (per logging)
   * @param promptConfig - Configurazione del prompt (opzionale)
   * @returns Promise con la risposta del modello LLM
   */
  async getLLMResponse(
    promptId: string,
    history: ConversationEntry[],
    chatbotName: string,
    promptConfig?: PromptConfig
  ): Promise<ConversationEntry> {
    try {
      LoggerService.info(
        `Richiesta LLM per ${chatbotName} con promptId: ${promptId}`
      )

      // Ottieni la configurazione del prompt
      let config = promptConfig

      // Se non è stata fornita una configurazione e abbiamo un repository, prova a recuperarla
      if (!config && this.promptRepository) {
        const prompt = await this.promptRepository.getById(promptId)
        if (prompt) {
          config = {
            prompt: prompt.prompt,
            model: prompt.model,
            temperature: prompt.temperature,
          }
        }
      }

      // Se non è stato possibile recuperare la configurazione, usa valori predefiniti
      if (!config) {
        LoggerService.warning(
          `Prompt ${promptId} non trovato, uso configurazione predefinita`
        )
        config = {
          prompt:
            "Sei un assistente utile e amichevole. Rispondi in modo chiaro e conciso.",
          model: "gpt-4-0125-preview",
          temperature: 0.7,
        }
      }

      // Prepara i messaggi per la richiesta
      const messages = [{ role: "system", content: config.prompt }, ...history]

      LoggerService.debug("Invio richiesta a OpenAI", {
        model: config.model,
        temperature: config.temperature,
        messages,
      })

      // Invia la richiesta a OpenAI
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: config.model,
          messages,
          temperature: config.temperature,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      )

      // Estrai la risposta
      const assistantResponse = response.data.choices[0].message

      LoggerService.info(`Risposta LLM ricevuta per ${chatbotName}`)
      LoggerService.debug("Risposta LLM", assistantResponse)

      return {
        role: "assistant",
        content: assistantResponse.content,
      }
    } catch (error: any) {
      LoggerService.error(
        `Errore nella richiesta LLM per ${chatbotName}`,
        error
      )

      // Restituisci un messaggio di errore come risposta
      return {
        role: "assistant",
        content:
          "Mi dispiace, si è verificato un errore durante l'elaborazione della tua richiesta. Riprova più tardi.",
      }
    }
  }
}
