import cors from "cors"
import dotenv from "dotenv"
import { EventEmitter } from "events"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import path from "path"
import pkg from "pg"
import { fileURLToPath } from "url"
import unlikeRouter from "./src/poulin/share/unlike.js"
import usageRouter from "./src/poulin/share/usage.js"

import chatbotMainRouter from "./src/poulin/chatbots/main/chatbots.js"
import historyRouter from "./src/poulin/share/history.js"
import promptRouter from "./src/poulin/share/prompts.js"
import usersRouter from "./src/poulin/users.js"
import authRouter from "./src/poulin/utility/auth.js"
import backupRouter from "./src/poulin/utility/backup.js"
import modelsRouter from "./src/poulin/utility/models.js"
import monthlyUsageRouter from "./src/poulin/utility/monthlyUsage.js"
import promptsManagerRouter from "./src/poulin/utility/promptsManager.js"
import modelrolesRouter from "./src/poulin/utility/roles.js"
import modelWebooksRouter from "./src/poulin/webhook.js"
import welcomeRouter from "./welcome.js"

const { Pool } = pkg

dotenv.config()

// Configura il pool di connessione al database
const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL
if (!databaseUrl) {
  console.error(
    "HEROKU_POSTGRESQL_AMBER_URL is not set in environment variables"
  )
  process.exit(1)
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Necessario per Heroku...
  },
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, "..")

// Inizializza l'app Express
const app = express()

// Abilita il trust per i proxy (necessario per Heroku e express-rate-limit)
app.set("trust proxy", 1)

// Configurazioni di sicurezza con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://ai.dairy-tools.com/"],
        styleSrc: ["'self'", "https://ai.dairy-tools.com/"],
        imgSrc: [
          "'self'",
          "data:",
          "https://ai.dairy-tools.com/",
          "https://poulin-bd075425a92c.herokuapp.com/",
        ],
        connectSrc: [
          "'self'",
          "https://ai.dairy-tools.com/",
          "http://localhost:3000",
          "http://localhost:3001",
          "https://poulin-bd075425a92c.herokuapp.com/",
        ],
      },
    },
  })
)

// Configurazione CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ai.dairy-tools.com",
    ], // Permetti richieste da questi domini
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// Middleware per parsing JSON
app.use(express.json())

// Limite di richieste
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 ore
  max: 350, // richieste al giorno
  message: { error: "Request limit reached today. Try again tomorrow." },
})

// Aggiungi supporto per richieste preflight
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.sendStatus(200)
})

// Forza HTTPS in produzione
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.hostname + req.url)
    }
    next()
  })
}

// Middleware per logging delle richieste e risposte
app.use((req, res, next) => {
  const requestDetails = {
    method: req.method,
    path: req.path,
    params: req.params,
    body: req.body,
    timestamp: new Date().toISOString(),
  }

  next()
})

app.use("/", welcomeRouter)
app.use("/auth", limiter, authRouter)
app.use("/users", limiter, usersRouter)
app.use("/invoices", limiter, monthlyUsageRouter)
app.use("/models", limiter, modelsRouter)
app.use("/webhook", limiter, modelWebooksRouter)
app.use("/roles", limiter, modelrolesRouter)
app.use("/prompts", limiter, promptsManagerRouter)
app.use("/prompt", limiter, promptRouter)
app.use("/history", limiter, historyRouter)

app.use("/poulin/main/usage", limiter, usageRouter)
app.use("/poulin/main/prompt", limiter, promptRouter)
app.use("/poulin/main/chatbot", limiter, chatbotMainRouter)
app.use("/poulin/main/unlike", limiter, unlikeRouter)
app.use("/poulin/main/backup", limiter, backupRouter)
app.use("/poulin/main/history", limiter, historyRouter)

const PORT = process.env.PORT || 4999
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const bus = new EventEmitter()
bus.setMaxListeners(20)
