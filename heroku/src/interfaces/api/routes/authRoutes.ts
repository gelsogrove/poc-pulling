import express from "express"
import { AuthController } from "../../controllers/AuthController.js"

export const createAuthRoutes = () => {
  const router = express.Router()
  const authController = new AuthController()

  router.post("/login", (req, res) => authController.login(req, res))

  return router
}
