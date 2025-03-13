import dotenv from "dotenv"
import { LoggerService } from "../../domain/services/LoggerService.js"

// Carica le variabili d'ambiente
dotenv.config()

/**
 * Tipo per il pool di connessione
 */
type PoolType = any

/**
 * Configurazione del pool di connessione al database
 */
export const createDatabasePool = async (): Promise<PoolType> => {
  try {
    // Import dinamico del modulo pg
    const pg = await import("pg")
    const { Pool } = pg

    // Log delle informazioni di connessione (senza credenziali sensibili)
    LoggerService.info(
      `Tentativo di connessione al database: ${
        process.env.DATABASE_URL ? "URL configurato" : "URL mancante"
      }`
    )
    LoggerService.info(
      `Modalità di connessione: ${
        process.env.NODE_ENV === "production"
          ? "Produzione (SSL)"
          : "Sviluppo (No SSL)"
      }`
    )

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || "",
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    })

    // Evento per gestire gli errori di connessione
    pool.on("error", (err) => {
      LoggerService.error(
        "Errore imprevisto nel pool di connessione al database",
        err
      )
    })

    // Verifica la connessione al database
    pool.query("SELECT NOW()", (err, res) => {
      if (err) {
        LoggerService.error("Errore nella connessione al database", err)
      } else {
        LoggerService.info("Connessione al database stabilita con successo")
      }
    })

    return pool
  } catch (error) {
    LoggerService.error(
      "Errore nella creazione del pool di connessione al database",
      error instanceof Error ? error.message : String(error)
    )

    // Fallback per ambiente di sviluppo: ritorniamo un mock del pool
    if (process.env.NODE_ENV !== "production") {
      LoggerService.warning(
        "Utilizzo mock del database per ambiente di sviluppo"
      )
      return createMockPool()
    }

    throw error
  }
}

/**
 * Crea un mock del pool di connessione per lo sviluppo
 * quando la connessione al DB reale fallisce
 */
const createMockPool = () => {
  return {
    query: (text: string, params: any, callback?: any) => {
      if (typeof callback === "function") {
        callback(null, { rows: [] })
      }
      return Promise.resolve({ rows: [] })
    },
    on: (event: string, callback: any) => {
      // Mock dell'evento
    },
    // Altri metodi necessari per il mock
  }
}

/**
 * Singleton per il pool di connessione al database
 */
let databasePool: PoolType | null = null

/**
 * Ottiene il pool di connessione al database
 * @returns Pool di connessione al database
 */
export const getDatabasePool = async (): Promise<PoolType> => {
  if (!databasePool) {
    databasePool = await createDatabasePool()
  }
  return databasePool
}
