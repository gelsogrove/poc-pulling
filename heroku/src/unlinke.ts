import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Presuppone che pool sia correttamente configurato
import { getUserIdByToken, validateUser } from "./validateUser.js" // Presuppone che queste funzioni esistano

const unlikeRouter = Router()

// Funzione per validare il token
const validateToken = async (
  token: string,
  res: Response
): Promise<string | null> => {
  const userId = await getUserIdByToken(token)
  if (!userId) {
    res.status(400).json({ message: "Token non valido" })
    return null
  }
  return userId
}

// Endpoint per inserire un record nella tabella "unlike"
unlikeRouter.post(
  "/new",
  async (req: Request, res: Response): Promise<void> => {
    const { conversationId, msgId, dataTime, token } = req.body

    // Validazione input
    if (!conversationId || !msgId || !dataTime || !token) {
      res.status(400).json({ error: "All fields are required." })
      return
    }

    try {
      // Convert token to userId
      const userId = await validateToken(token, res)
      if (!userId) return // Se il token non è valido, interrompe l'esecuzione

      await validateUser(userId) // Validazione dell'utente, se necessario

      // Query per inserire il record
      const query = `
      INSERT INTO unlike (conversationId, msgId, dataTime)
      VALUES ($1, $2, $3)
      RETURNING idUnlike, conversationId, msgId, dataTime
    `
      const values = [conversationId, msgId, dataTime]

      // Esegui la query
      const result = await pool.query(query, values)

      // Restituisci il risultato
      res.status(201).json({
        message: "Record inserted successfully",
        data: result.rows[0],
      })
    } catch (error) {
      console.error("Error inserting record:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default unlikeRouter
