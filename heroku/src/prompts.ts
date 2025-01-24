import { RequestHandler, Router } from "express"
import { pool } from "../server.js"
import { validateRequest } from "./validateUser.js"

const promptRouter = Router()

/**
 * Handler per aggiornare un prompt.
 */
const UpdatePromptHandler: RequestHandler = async (req, res) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { content, model, temperature, idPrompt } = req.body

  try {
    if (content.length > 25000) {
      res
        .status(400)
        .json({ message: "Il contenuto è troppo lungo: " + content.length })
      return
    }

    const result = await pool.query(
      "UPDATE prompts SET prompt = $1, model = $2, temperature= $3 WHERE idPrompt = $4 RETURNING *",
      [content, model, temperature, idPrompt]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Prompt non trovato" })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error updating prompt:",
      error instanceof Error ? error.message : error
    )
    res
      .status(500)
      .json({ message: "Errore durante l'aggiornamento del prompt." })
  }
}

/**
 * Handler per ottenere un prompt.
 */
const GetPromptHandler: RequestHandler = async (req, res) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { idPrompt } = req.query

  try {
    const result = await pool.query(
      "SELECT prompt, model, temperature FROM prompts WHERE idPrompt = $1",
      [idPrompt]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Prompt non trovato." })
      return
    }

    const content = result.rows[0]
    res.status(200).json({ content })
  } catch (error) {
    console.error(
      "Error fetching prompt:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ message: "Errore durante la lettura del prompt." })
  }
}

promptRouter.put("/", UpdatePromptHandler)
promptRouter.get("/", GetPromptHandler)

export default promptRouter
