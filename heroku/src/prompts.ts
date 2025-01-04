import { RequestHandler, Response, Router } from "express"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"

const promptRouter = Router()

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

const UpdatePromptHandler: RequestHandler = async (req, res) => {
  const { content, token } = req.body

  try {
    if (!(await validateToken(token, res))) return

    if (content.length > 10000) {
      res.status(400).json({ message: "Il contenuto è troppo lungo" })
      return
    }

    const result = await pool.query(
      "UPDATE prompts SET prompt = $1 WHERE idPrompt = $2 RETURNING *",
      [content, "a2c502db-9425-4c66-9d92-acd3521b38b5"]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Prompt non trovato" })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json("Errore durante l'aggiornamento del prompt" + error)
  }
}

const GetPromptHandler: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT prompt FROM prompts WHERE idPrompt = $1",
      [1]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Prompt non trovato" })
      return
    }

    const content = result.rows[0].prompt
    res.status(200).json({ content })
  } catch (error) {
    res.status(500).json("Errore durante la lettura del prompt" + error)
  }
}

promptRouter.put("/", UpdatePromptHandler)
promptRouter.get("/", GetPromptHandler)

export default promptRouter
