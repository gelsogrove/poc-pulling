import pkg from "pg"
const { Pool } = pkg

// Configurazione del pool di connessione
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

export interface Prompt {
  prompt: string
  model: string
  temperature: number
}

/**
 * Recupera un prompt dal database
 * @param promptId ID del prompt da recuperare
 * @returns Il prompt con il modello e la temperatura
 * @throws Error se il prompt non viene trovato
 */
export async function getPrompt(promptId: number): Promise<Prompt> {
  try {
    const result = await pool.query(
      "SELECT prompt, model, temperature FROM prompts WHERE id = $1",
      [promptId]
    )

    if (result.rows.length === 0) {
      throw new Error(`Prompt con ID ${promptId} non trovato`)
    }

    return result.rows[0]
  } catch (error) {
    console.error("Errore nel recupero del prompt:", error)
    throw error
  }
}
