import { Router } from "express"
import chatbotMainRouter from "./chatbots/main/chatbots.js"
import {
  promptMainRouter,
  unlikeOrdersRouter,
  usageMainRouter,
} from "./share/index.js"

const router = Router()

// Register the main chatbot router
router.use("/main", chatbotMainRouter)

// Register other routes as needed
router.use("/usage", usageMainRouter)
router.use("/prompt", promptMainRouter)
router.use("/unlike", unlikeOrdersRouter)

// Export the routers
export const chatbotRouter = router.use("/main", chatbotMainRouter)
export const usageRouter = router.use("/usage", usageMainRouter)
export const promptRouter = router.use("/prompt", promptMainRouter)
export const unlikeRouter = router.use("/unlike", unlikeOrdersRouter)

export default router
