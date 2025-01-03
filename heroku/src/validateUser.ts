import { QueryResult } from "pg"
import { pool } from "../server.js" // Assicurati di importare il pool dal tuo file principale

export const validateUser = async (userId: string) => {
  try {
    const result = (await pool.query(
      `SELECT expire_date FROM users WHERE userid = $1`,
      [userId]
    )) as QueryResult<{ expire_date: string }>

    if (result.rowCount === 0) {
      throw new Error("User not found.")
    }

    const expireDate = result.rows[0].expire_date
    if (new Date(expireDate) < new Date()) {
      throw new Error("User subscription has expired.")
    }

    return true // L'utente esiste e la data di scadenza è valida
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Validation error: ${error.message}`)
    }
    throw new Error("An unknown error occurred")
  }
}

// Funzione per ottenere l'userId dal token
export const getUserIdByToken = async (
  token: string
): Promise<string | null> => {
  try {
    const result = (await pool.query(
      `SELECT userid FROM users WHERE token = $1`,
      [token]
    )) as QueryResult<{ userid: string }>

    if ((result.rowCount ?? 0) > 0) {
      return result.rows[0].userid
    } else {
      return null
    }
  } catch (error) {
    return null
  }
}
