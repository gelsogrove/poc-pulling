import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Presuppone che pool sia correttamente configurato
import { validateRequest, validateUser } from "./validateUser.js" // Presuppone che queste funzioni esistano

const unlikeRouter = Router()

/**
 * Endpoint per creare un nuovo record di unlike.
 */
unlikeRouter.post(
  "/new",
  async (req: Request, res: Response): Promise<void> => {
    const userId = await validateRequest(req, res)
    if (!userId) return

    const { conversationId, msgId, dataTime, conversationHistory, idPrompt } =
      req.body

    if (!conversationId || !msgId || !dataTime || !conversationHistory) {
      res.status(400).json({ error: "All fields are required." })
      return
    }

    try {
      await validateUser(userId)

      const checkQuery = `
      SELECT 1 FROM unlike
      WHERE conversationId = $1 AND msgid = $2
    `
      const checkResult = await pool.query(checkQuery, [conversationId, msgId])

      if (checkResult?.rowCount && checkResult.rowCount > 0) {
        const deleteQuery = `
        DELETE FROM unlike
        WHERE conversationId = $1 AND msgid = $2
      `
        await pool.query(deleteQuery, [conversationId, msgId])

        res.status(200).json({
          message:
            "Record already existed and has been deleted. No new record inserted.",
        })
        return
      }

      const conversationHistoryString = JSON.stringify(conversationHistory)

      const query = `
      INSERT INTO unlike (conversationId, msgId, dataTime, conversationHistory,idPrompt)
      VALUES ($1, $2, $3, $4, $5)
    `
      const values = [
        conversationId,
        msgId,
        dataTime,
        conversationHistoryString,
        idPrompt,
      ]

      await pool.query(query, values)

      res.status(201).json({
        message: "Record inserted successfully",
      })
    } catch (error) {
      console.error(
        "Error inserting record:",
        error instanceof Error ? error.message : error
      )
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

unlikeRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { idPrompt } = req.params // Cambiato da req.params a req.query

  try {
    const query = `
      SELECT * FROM unlike WHERE idPrompt = $1 ORDER BY datatime DESC
    `
    const result = await pool.query(query, [idPrompt]) // Aggiunto il valore di bind

    console.log("Executing query:", query)
    console.log("With values:", idPrompt)

    res.status(200).json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching records:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error" })
  }
})

/**
 * Endpoint per eliminare un record.
 */
unlikeRouter.delete(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    const userId = await validateRequest(req, res)
    if (!userId) return

    const { id } = req.params

    try {
      await validateUser(userId)

      const query = `
      DELETE FROM unlike
      WHERE idUnlike = $1
    `
      const result = await pool.query(query, [id])

      if (result.rowCount === 0) {
        res.status(404).json({ error: "Record not found or not authorized." })
        return
      }

      res.status(204).send()
    } catch (error) {
      console.error(
        "Error deleting record:",
        error instanceof Error ? error.message : error
      )
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

export default unlikeRouter
