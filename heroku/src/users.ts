import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Importa il pool dal file principale
import { validateRequest } from "./validateUser.js"

const usersRouter = Router()

// Crea un nuovo utente
usersRouter.post("/new", async (req: Request, res: Response) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { name, role, username, surname, active, isActive } = req.body

  try {
    const query =
      "INSERT INTO users (name, role, username, surname, active, isActive) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *"
    const values = [name, role, username, surname, active, isActive]

    const result = await pool.query(query, values)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error during insertion:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Ottieni tutti gli utenti
usersRouter.get("/", async (req: Request, res: Response) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  try {
    const result = await pool.query("SELECT * FROM users ORDER BY name ASC")
    res.json(result.rows)
  } catch (error) {
    console.error("Error during retrieval:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Aggiorna un utente
usersRouter.put("/:id", async (req: Request, res: Response) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params
  const { name, role, username, surname, active, isActive } = req.body

  if (
    !name ||
    !role ||
    !username ||
    !surname ||
    active === undefined ||
    isActive === undefined
  ) {
    res.status(400).json({ error: "All fields are required." })
    return
  }

  try {
    const query =
      "UPDATE users SET name = $1, role = $2, username = $3, surname = $4, active = $5, isActive = $6 WHERE id = $7 RETURNING *"
    const values = [name, role, username, surname, active, isActive, id]

    const result = await pool.query(query, values)
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error during update:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Elimina un utente
usersRouter.delete("/:id", async (req: Request, res: Response) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error("Error during deletion:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Cambia stato isActive
usersRouter.patch("/:id/isActive", async (req: Request, res: Response) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params
  const { isActive } = req.body

  try {
    const query = "UPDATE users SET isActive = $1 WHERE id = $2 RETURNING *"
    const values = [isActive, id]

    const result = await pool.query(query, values)
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating active status:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

export default usersRouter
