import { RequestHandler, Response, Router } from "express"
import { pool } from "../server.js"
import { extractValuesFromPrompt, getUserIdByToken } from "./validateUser.js"

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

    if (content.length > 25000) {
      res
        .status(400)
        .json({ message: "Il contenuto è troppo lungo" + content.length })
      return
    }

    const { temperature, model } = extractValuesFromPrompt(content)
    const truncatedPrompt = content.split("=== ENDPROMPT ===")[0].trim()

    const result = await pool.query(
      "UPDATE prompts SET prompt = $1, model = $2, temperature= $3 WHERE idPrompt = $4 RETURNING *",
      [
        truncatedPrompt,
        model,
        temperature,
        "a2c502db-9425-4c66-9d92-acd3521b38b5",
      ]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Prompt non trovato" })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json("Errore  l'aggiornamento del prompt" + error)
  }
}

const PostGetPromptHandler: RequestHandler = async (req, res) => {
  const { token } = req.body

  try {
    if (!(await validateToken(token, res))) return

    const result = await pool.query(
      "SELECT prompt,model,temperature FROM prompts WHERE idPrompt = $1",
      ["a2c502db-9425-4c66-9d92-acd3521b38b5"]
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
promptRouter.post("/", PostGetPromptHandler)

export default promptRouter
