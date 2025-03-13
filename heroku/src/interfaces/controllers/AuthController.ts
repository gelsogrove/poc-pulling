import bcrypt from "bcrypt"
import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { pool } from "../../infrastructure/database/database.js"

export class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body

    try {
      // Cerca l'utente nel database
      const result = await pool.query(
        "SELECT userid, username, password, name, role FROM users WHERE username = $1",
        [username]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" })
      }

      const user = result.rows[0]

      // Verifica la password
      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" })
      }

      // Genera il token JWT
      const token = jwt.sign(
        { userId: user.userid, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      )

      // Restituisci i dati dell'utente e il token
      return res.json({
        userId: user.userid,
        username: user.username,
        name: user.name,
        role: user.role,
        token,
      })
    } catch (error) {
      console.error("Login error:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }
}
