import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Presuppone che pool sia correttamente configurato
import { validateRequest, validateUser } from "./validateUser.js" // Presuppone che queste funzioni esistano

const unlikeRouter = Router()

/**
 * Endpoint per creare un nuovo record di unlike.
 */
const createUnlikeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("SQL14")

  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  console.log("SQL14", userId)

  const { conversationId, msgId, dataTime, conversationHistory, idPrompt } =
    req.body

  if (!conversationId || !msgId || !dataTime || !conversationHistory) {
    res.status(400).json({ error: "All fields are required." })
    return
  }

  console.log("SQL30")
  try {
    console.log("SQL31")
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

    console.log("SQL53")
    const query = `
    INSERT INTO unlike (conversationId, msgId, dataTime, conversationHistory,idPrompt,userid)
    VALUES ($1, $2, $3, $4, $5, $6)
  `
    const values = [
      conversationId,
      msgId,
      dataTime,
      conversationHistoryString,
      idPrompt,
      userId,
    ]

    const fullQuery = query.replace(/\$1/g, `'${values[0]}'`)
    console.log("SQL", fullQuery)

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

/**
 * Endpoint per ottenere i record di unlike.
 */
const getUnlikeHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  // Estrai il parametro idPrompt dal corpo della richiesta (payload)
  const { idPrompt } = req.query

  try {
    const query = `
      SELECT * FROM unlike WHERE idPrompt = $1 ORDER BY datatime DESC
    `
    const values = [idPrompt] // Valori di bind

    // Genera una query completa per il debug
    const fullQuery = query.replace(/\$1/g, `'${values[0]}'`)
    console.log(fullQuery)

    const result = await pool.query(query, values)

    res.status(200).json(result.rows)
  } catch (error) {
    console.error(
      "Error fetching records:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error" })
  }
}

/**
 * Endpoint per eliminare un record.
 */
const deleteUnlikeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params

  try {
    await validateUser(userId)

    const query = `
    DELETE FROM unlike
    WHERE idUnlike = $1
  `

    // Genera una query completa per il debug
    const values = [id]
    const fullQuery = query.replace(/\$1/g, `'${values[0]}'`)
    console.log(fullQuery)

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

// Definizione delle rotte con i rispettivi handler
unlikeRouter.post("/new", createUnlikeHandler) // Rotta per creare un nuovo record di unlike
unlikeRouter.get("/", getUnlikeHandler) // Rotta per ottenere i record di unlike
unlikeRouter.delete("/:id", deleteUnlikeHandler) // Rotta per eliminare un record di unlike

export default unlikeRouter
