import bcrypt from "bcrypt"
import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Importa il pool dal file principale
import { validateRequest } from "./validateUser.js"

const usersRouter = Router()

// Ottieni tutti gli utenti
usersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT userid, name,surname, role,username,isactive FROM users ORDER BY name ASC"
    )
    res.json(result.rows)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Aggiorna un utente
usersRouter.put("/update/:id", async (req: Request, res: Response) => {
  const { id } = req.params
  let { name, role, username, surname, isActive } = req.body

  if (isActive === null) {
    isActive = true
  }
  try {
    const query =
      "UPDATE users SET name = $1, role = $2, username = $3, surname = $4, isactive = $5 WHERE userid = $6 RETURNING *"
    const values = [name, role, username, surname, isActive, id]
    const result = await pool.query(query, values)
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating user:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Elimina un utente
usersRouter.delete("/delete/:id", async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const result = await pool.query("DELETE FROM users WHERE userid = $1", [id])
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Cambia stato isActive
usersRouter.get("/isactive/:id", async (req: Request, res: Response) => {
  const { id } = req.params
  const { isActive } = req.body
  try {
    const query = "UPDATE users SET isActive = $1 WHERE userid = $2 RETURNING *"
    const values = [isActive, id]
    const result = await pool.query(query, values)
    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error toggling user active status:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

// Cambia la password di un utente
usersRouter.put("/change-password", async (req: Request, res: Response) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { newPassword } = req.body

  if (!newPassword) {
    res.status(400).json({ error: "New password is required." })
    return
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log(hashedPassword)
    console.log(userId)
    const query = "UPDATE users SET password = $1 WHERE userid = $2 RETURNING *"
    const values = [hashedPassword, userId]

    const result = await pool.query(query, values)

    if (result.rowCount === 0) {
      res.status(404).json({ error: "User not found." })
      return
    }

    res.status(200).json({ message: "Password changed successfully." })
  } catch (error) {
    console.error("Error during password change:", error)
    res.status(500).json({ error: "Internal server error." })
  }
})

export default usersRouter
