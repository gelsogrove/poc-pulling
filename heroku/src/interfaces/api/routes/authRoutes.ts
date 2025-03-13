import express from "express"
import { AuthController } from "../../controllers/AuthController.js"

export const createAuthRoutes = () => {
  const router = express.Router()
  const authController = new AuthController()

  router.post("/login", async (req, res) => {
    try {
      await authController.login(req, res)
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  })

  return router
}
