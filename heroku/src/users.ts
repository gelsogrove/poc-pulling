import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Importa il pool dal file principale

import { validateRequest } from "./validateUser.js"

const usersRouter = Router()

const createUserHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { name, role, username, surname, active } = req.body

  try {
    const query =
      "INSERT INTO users (name, role, username, surname, active) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    const values = [name, role, username, surname, active]

    const result = await pool.query(query, values)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error during insertion:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error." })
  }
}

const getUsersHandler = async (req: Request, res: Response): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  try {
    const result = await pool.query("SELECT * FROM users ORDER BY name ASC")
    res.json(result.rows)
  } catch (error) {
    console.error(
      "Error during retrieval:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error." })
  }
}

const updateUserHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params
  const { name, role, username, surname, active } = req.body

  if (!name || !role || !username || !surname || active === undefined) {
    res.status(400).json({ error: "All fields are required." })
    return
  }

  try {
    const query =
      "UPDATE users SET name = $1, role = $2, username = $3, surname = $4, active = $5 WHERE userid = $6 RETURNING *"
    const values = [name, role, username, surname, active, id]

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
}

const deleteUserHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params

  try {
    const result = await pool.query("DELETE FROM users WHERE userid = $1", [id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error("Error during deletion:", error)
    res.status(500).json({ error: "Internal server error." })
  }
}

usersRouter.post("/new", createUserHandler)
usersRouter.get("/", getUsersHandler)
usersRouter.put("/:id", updateUserHandler)
usersRouter.delete("/:id", deleteUserHandler)

export default usersRouter
