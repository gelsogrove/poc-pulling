import { Prompt } from "../models/Prompt.js"

/**
 * Interfaccia per il repository dei prompt
 * Definisce le operazioni possibili sui prompt
 */
export interface IPromptRepository {
  /**
   * Recupera un prompt dal suo ID
   * @param id - ID univoco del prompt
   * @returns Promise con il prompt trovato o null se non esiste
   */
  getById(id: string): Promise<Prompt | null>

  /**
   * Recupera tutti i prompt disponibili
   * @returns Promise con l'array di tutti i prompt
   */
  getAll(): Promise<Prompt[]>

  /**
   * Recupera i prompt in base ai tag
   * @param tags - Array di tag da cercare
   * @returns Promise con l'array dei prompt che contengono almeno uno dei tag specificati
   */
  getByTags(tags: string[]): Promise<Prompt[]>
}
