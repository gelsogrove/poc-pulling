import express from "express"
import rateLimit from "express-rate-limit"
// ... altri import

import modelsRouter from "./poulin/models.js"
import rolesRouter from "./poulin/roles.js"
// ... altri import dei router

const app = express()

// ... middleware e altre configurazioni

// Limiter per le richieste
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite di 100 richieste per windowMs
})

// ... altre route
app.use("/models", limiter, modelsRouter)
app.use("/roles", limiter, rolesRouter) // Aggiungiamo la route per i ruoli
// ... altre route

export { app, pool }
