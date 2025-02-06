import { Request, Response, Router } from "express"
import { pool } from "../../../server.js" // Aggiungi .js e usa percorso relativo corretto
import { validateRequest, validateUser } from "../validateUser.js" // Presuppone che queste funzioni esistano
import { sendUsageData } from "./chatbots_utility.js"

const unlikeRouter = Router()

/**
 * Endpoint per creare un nuovo record di unlike.
 */
const createUnlikeHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  const {
    conversationId,
    msgId,
    dataTime,
    conversationHistory,
    idPrompt,
    model,
    temperature,
  } = req.body

  if (
    !conversationId ||
    !msgId ||
    !dataTime ||
    !conversationHistory ||
    !model ||
    !temperature
  ) {
    res.status(400).json({ error: "All fields are required." })
    return
  }

  try {
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
    INSERT INTO unlike (conversationId, msgId, dataTime, conversationHistory,idPrompt,userid, model, temperature)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `
    const values = [
      conversationId,
      msgId,
      dataTime,
      conversationHistoryString,
      idPrompt,
      userId,
      model,
      temperature,
    ]

    const fullQuery = query.replace(/\$1/g, `'${values[0]}'`)

    await pool.query(query, values)

    const day = new Date().toISOString().split("T")[0]
    await sendUsageData(day, -0.2, token, "dislike", userId, idPrompt)

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

  const { idPrompt } = req.query

  try {
    const query = `
      SELECT * FROM unlike WHERE idPrompt = $1 ORDER BY datatime DESC
    `
    const values = [idPrompt]
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

/**
 * Endpoint per verificare se esistono unlike per un prompt.
 */
const checkUnlikeExistsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { idPrompt } = req.query

  try {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM unlike 
        WHERE idPrompt = $1
      )
    `
    const result = await pool.query(query, [idPrompt])

    res.status(200).json({ exists: result.rows[0].exists })
  } catch (error) {
    console.error(
      "Error checking unlike existence:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error" })
  }
}

// Definizione delle rotte con i rispettivi handler
unlikeRouter.post("/new", createUnlikeHandler) // Rotta per creare un nuovo record di unlike
unlikeRouter.get("/", getUnlikeHandler) // Rotta per ottenere i record di unlike
unlikeRouter.delete("/:id", deleteUnlikeHandler) // Rotta per eliminare un record di unlike
unlikeRouter.get("/check", checkUnlikeExistsHandler)

export default unlikeRouter
