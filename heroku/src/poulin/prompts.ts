import { RequestHandler, Router } from "express"
import { pool } from "../../server.js"
import { validateRequest } from "./validateUser.js"

const promptsRouter = Router()

// Funzione per creare un nuovo prompt
const createPrompt: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { promptname, model, temperature, prompt } = req.body
  if (!promptname || !model || !prompt) {
    res.status(400).json({ error: "Required fields cannot be null" })
    return
  }

  try {
    const result = await pool.query(
      "INSERT INTO prompts (promptname, model, temperature, prompt) VALUES ($1, $2, $3, $4) RETURNING *",
      [promptname, model, temperature, prompt]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating prompt:", error)
    res.status(500).json({ error: "Error during prompt creation" })
  }
}

// Funzione per ottenere tutti i prompts
const getPrompts: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  try {
    const result = await pool.query(
      "SELECT * FROM prompts ORDER BY promptname ASC"
    )
    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Error fetching prompts:", error)
    res.status(500).json({ error })
  }
}

// Funzione per aggiornare un prompt esistente
const updatePrompt: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { id } = req.params
  const { promptname, model, temperature, prompt } = req.body
  if (!promptname || !model || !prompt) {
    res.status(400).json({ error: "Required fields cannot be null" })
    return
  }

  try {
    const result = await pool.query(
      "UPDATE prompts SET promptname = $1, model = $2, temperature = $3, prompt = $4 WHERE idprompt = $5 RETURNING *",
      [promptname, model, temperature, prompt, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }
    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Error updating prompt:", error)
    res.status(500).json({ error })
  }
}

// Funzione per eliminare un prompt
const deletePrompt: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { idprompt } = req.params
  try {
    // Verifica se il prompt è in uso nella tabella usage
    const usageCheck = await pool.query(
      `
      SELECT COUNT(*)
      FROM usage
      WHERE idprompt = $1
    `,
      [idprompt]
    )

    if (parseInt(usageCheck.rows[0].count) > 0) {
      res
        .status(400)
        .json({ error: "Cannot delete prompt because it is in use" })
      return
    }

    const result = await pool.query("DELETE FROM prompts WHERE idprompt = $1", [
      idprompt,
    ])

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting prompt:", error)
    res.status(500).json({ error: "Error while deleting prompt" })
  }
}

// Definizione delle rotte
promptsRouter.post("/new", createPrompt)
promptsRouter.get("/", getPrompts)
promptsRouter.put("/update/:id", updatePrompt)
promptsRouter.delete("/delete/:idprompt", deletePrompt)

export default promptsRouter
