import { Pool } from "pg"
import { Prompt } from "../../domain/models/Prompt.js"
import { IPromptRepository } from "../../domain/repositories/IPromptRepository.js"
import { LoggerService } from "../../domain/services/LoggerService.js"

/**
 * Implementazione del repository dei prompt
 * Gestisce la persistenza e il recupero dei prompt
 */
export class PromptRepository implements IPromptRepository {
  /**
   * Costruttore del repository dei prompt
   * @param pool - Pool di connessione al database
   */
  constructor(private readonly pool: Pool) {}

  /**
   * Recupera un prompt dal suo ID
   * @param id - ID univoco del prompt
   * @returns Promise con il prompt trovato o null se non esiste
   */
  async getById(id: string): Promise<Prompt | null> {
    try {
      LoggerService.info(`Recupero prompt con ID: ${id}`)

      const query = `
        SELECT id, prompt, model, temperature, tags, created_at, updated_at
        FROM prompts
        WHERE id = $1
      `

      const result = await this.pool.query(query, [id])

      if (result.rows.length === 0) {
        LoggerService.warning(`Prompt con ID ${id} non trovato`)
        return null
      }

      const row = result.rows[0]

      return {
        id: row.id,
        prompt: row.prompt,
        model: row.model,
        temperature: row.temperature,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    } catch (error) {
      LoggerService.error(`Errore nel recupero del prompt con ID ${id}`, error)

      // In caso di errore, restituiamo un prompt predefinito
      return {
        id: "default-prompt",
        prompt:
          "Sei un assistente utile e amichevole. Rispondi in modo chiaro e conciso.",
        model: "gpt-4-0125-preview",
        temperature: 0.7,
      }
    }
  }

  /**
   * Recupera tutti i prompt disponibili
   * @returns Promise con l'array di tutti i prompt
   */
  async getAll(): Promise<Prompt[]> {
    try {
      LoggerService.info("Recupero di tutti i prompt")

      const query = `
        SELECT id, prompt, model, temperature, tags, created_at, updated_at
        FROM prompts
        ORDER BY created_at DESC
      `

      const result = await this.pool.query(query)

      return result.rows.map((row) => ({
        id: row.id,
        prompt: row.prompt,
        model: row.model,
        temperature: row.temperature,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    } catch (error) {
      LoggerService.error("Errore nel recupero di tutti i prompt", error)
      return []
    }
  }

  /**
   * Recupera i prompt in base ai tag
   * @param tags - Array di tag da cercare
   * @returns Promise con l'array dei prompt che contengono almeno uno dei tag specificati
   */
  async getByTags(tags: string[]): Promise<Prompt[]> {
    try {
      if (!tags || tags.length === 0) {
        return this.getAll()
      }

      LoggerService.info(`Recupero prompt con tag: ${tags.join(", ")}`)

      // Costruisci una query che cerca i prompt con almeno uno dei tag specificati
      const query = `
        SELECT id, prompt, model, temperature, tags, created_at, updated_at
        FROM prompts
        WHERE tags && $1
        ORDER BY created_at DESC
      `

      const result = await this.pool.query(query, [tags])

      return result.rows.map((row) => ({
        id: row.id,
        prompt: row.prompt,
        model: row.model,
        temperature: row.temperature,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    } catch (error) {
      LoggerService.error(
        `Errore nel recupero dei prompt con tag: ${tags.join(", ")}`,
        error
      )
      return []
    }
  }
}
