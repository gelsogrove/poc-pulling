import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Presuppone che pool sia correttamente configurato
import { getUserIdByToken, validateUser } from "./validateUser.js" // Presuppone che queste funzioni esistano

const unlikeRouter = Router()

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

unlikeRouter.post(
  "/new",
  async (req: Request, res: Response): Promise<void> => {
    const { conversationId, msgId, dataTime, token, conversationHistory } =
      req.body

    // Validazione input
    if (
      !conversationId ||
      !msgId ||
      !dataTime ||
      !token ||
      !conversationHistory
    ) {
      res.status(400).json({ error: "All fields are required." })
      return
    }

    try {
      // Convert token to userId
      const userId = await validateToken(token, res)
      if (!userId) return // Se il token non è valido, interrompe l'esecuzione

      await validateUser(userId) // Validazione dell'utente, se necessario

      // Controlla se conversationId esiste già
      const checkQuery = `
        SELECT 1 FROM unlike
        WHERE conversationId = $1 
        LIMIT 1
      `
      const checkResult = await pool.query(checkQuery, [conversationId])

      if (checkResult?.rowCount && checkResult.rowCount > 0) {
        res.status(200).json({
          message: "Record already exists. No changes made.",
        })
        return
      }

      // Converti conversationHistory in stringa JSON
      const conversationHistoryString = JSON.stringify(conversationHistory)

      // Query per inserire il record
      const query = `
        INSERT INTO unlike (conversationId, msgId, dataTime, conversationHistory)
        VALUES ($1, $2, $3, $4)
        RETURNING idUnlike, conversationId, msgId, dataTime, conversationHistory
      `
      const values = [
        conversationId,
        msgId,
        dataTime,
        conversationHistoryString,
      ]

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

unlikeRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body

  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Token is required." })
    return
  }

  try {
    // Convert token to userId
    const userId = await validateToken(token, res)
    if (!userId) return

    await validateUser(userId) // Validazione dell'utente, se necessario

    // Query per ottenere tutti i record
    const query = `
        SELECT * FROM unlike ORDER BY dataTime DESC
      `
    const result = await pool.query(query)

    // Restituisci i risultati
    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Error fetching records:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

unlikeRouter.delete(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { token } = req.body

    if (!token) {
      res.status(400).json({ error: "Token is required." })
      return
    }

    try {
      // Convert token to userId
      const userId = await validateToken(token, res)
      if (!userId) return

      await validateUser(userId) // Validazione dell'utente, se necessario

      // Query per eliminare il record
      const query = `
        DELETE FROM unlike
        WHERE idUnlike = $1
      `
      const result = await pool.query(query, [id])

      if (result.rowCount === 0) {
        res.status(404).json({ error: "Record not found or not authorized." })
        return
      }

      // Restituisci il successo
      res.status(204).send() // Nessun contenuto
    } catch (error) {
      console.error("Error deleting record:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default unlikeRouter
