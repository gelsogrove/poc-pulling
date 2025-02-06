import bcrypt from "bcrypt"
import { Request, Response, Router } from "express"
import { pool } from "../../server.js" // Importa il pool dal file principale
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
usersRouter.put("/update/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  let { name, role, username, surname, isactive } = req.body

  try {
    const query =
      "UPDATE users SET name = $1, role = $2, username = $3, surname = $4, isactive = $5 WHERE userid = $6 RETURNING *"
    const values = [name, role, username, surname, isactive, userid]
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
usersRouter.delete("/delete/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  try {
    const result = await pool.query("DELETE FROM users WHERE userid = $1", [
      userid,
    ])
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
usersRouter.get("/isactive/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const { isActive } = req.body
  try {
    const query = "UPDATE users SET isactive = $1 WHERE userid = $2 RETURNING *"
    const values = [isActive, userid]
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
usersRouter.put(
  "/change-password",
  async (req: Request, res: Response): Promise<void> => {
    const { userId, token } = await validateRequest(req, res)
    if (!userId) {
      return
    }

    const { newPassword, userid } = req.body

    if (!newPassword) {
      res.status(400).json({ error: "New password is required." })
      return
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10) // Encrypt the new password
      const query =
        "UPDATE users SET password = $1 WHERE userid = $2 RETURNING *"
      const values = [hashedPassword, userid]

      const result = await pool.query(query, values)

      if (result.rowCount === 0) {
        console.error("No user found with the provided userId:", userId)
        res.status(404).json({ error: "User not found." })
        return
      }

      res.status(200).json({ message: "Password changed successfully." })
    } catch (error: any) {
      console.error("Error during password change:", error.message)
      res
        .status(500)
        .json({ error: "Internal server error.", details: error.message })
    }
  }
)

export default usersRouter
