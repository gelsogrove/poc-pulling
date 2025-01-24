import { RequestHandler, Response, Router } from "express"
import { pool } from "../server.js"
import { getUserIdByToken, validateUser } from "./validateUser.js"

const promptRouter = Router()

/**
 * Funzione generica per validare il token e l'utente.
 */
const validateRequest = async (
  req: any,
  res: Response
): Promise<string | null> => {
  const authHeader = req.headers["authorization"] as string | undefined
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null

  if (!token) {
    res.status(401).json({ message: "Missing or invalid token." })
    return null
  }

  try {
    const userId = await getUserIdByToken(token)
    if (!userId) {
      res.status(403).json({ message: "Invalid or expired token." })
      return null
    }

    const isUserValid = await validateUser(userId)
    if (!isUserValid) {
      res.status(403).json({ message: "User is not authorized." })
      return null
    }

    return userId
  } catch (error) {
    console.error(
      "Error during token validation:",
      error instanceof Error ? error.message : error
    )
    res
      .status(500)
      .json({ message: "Internal server error during validation." })
    return null
  }
}

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
const PostGetPromptHandler: RequestHandler = async (req, res) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { idPrompt } = req.body

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
promptRouter.post("/", PostGetPromptHandler)

export default promptRouter
