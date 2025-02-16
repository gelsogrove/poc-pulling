import cors from "cors"
import dotenv from "dotenv"
import { EventEmitter } from "events"
import express, { Request, Response } from "express"
import rateLimit from "express-rate-limit"
import fs from "fs"
import helmet from "helmet"
import path from "path"
import pkg from "pg"
import { fileURLToPath } from "url"

import {
  chatbotRouter,
  promptRouter,
  unlikeRouter,
  usageRouter,
} from "./src/poulin/routerManager.js"
import usersRouter from "./src/poulin/users.js"
import authRouter from "./src/poulin/utility/auth.js"
import backupRouter from "./src/poulin/utility/backup.js"
import modelsRouter from "./src/poulin/utility/models.js"
import monthlyUsageRouter from "./src/poulin/utility/monthlyUsage.js"
import modelpromptsRouter from "./src/poulin/utility/promptsManagerRouter.js"
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
        imgSrc: ["'self'", "data:", "https://ai.dairy-tools.com/"],
        connectSrc: [
          "'self'",
          "https://ai.dairy-tools.com/",
          "http://localhost:3000",
          "http://localhost:3001",
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

// Aggiungiamo un log per vedere i percorsi
console.log({
  __dirname,
  rootDir,
  staticPath: path.join(rootDir, "public"),
})

// Middleware per servire le immagini
app.get("/images/chatbots/:filename", (req: Request, res: Response) => {
  const filename = req.params.filename
  const filePath = path.join(rootDir, "public/images/chatbots", filename)

  console.log({
    requestedFile: filename,
    fullPath: filePath,
    rootDir,
    exists: fs.existsSync(filePath),
    dirContents: fs.existsSync(path.dirname(filePath))
      ? fs.readdirSync(path.dirname(filePath))
      : "directory not found",
  })

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath)
  } else {
    // Log della struttura delle directory
    try {
      const publicDir = path.join(rootDir, "public")
      const imagesDir = path.join(publicDir, "images")
      console.log("Directory structure:", {
        rootExists: fs.existsSync(rootDir),
        publicExists: fs.existsSync(publicDir),
        imagesExists: fs.existsSync(imagesDir),
        chatbotsExists: fs.existsSync(path.join(imagesDir, "chatbots")),
      })
    } catch (error) {
      console.error("Error checking directories:", error)
    }

    res.status(404).send("Image not found")
  }
})

// Aggiungiamo anche un middleware per loggare le richieste di file statici
app.use((req, res, next) => {
  if (req.url.startsWith("/images")) {
    console.log("Requesting static file:", {
      url: req.url,
      fullPath: path.join(rootDir, "public", req.url),
    })
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
app.use("/prompts", limiter, modelpromptsRouter)

// Dynamic routes handled by routerManager
app.use("/poulin/:chatbot/usage", limiter, usageRouter)
app.use("/poulin/:chatbot/prompt", limiter, promptRouter)
app.use("/poulin/:chatbot/chatbot", limiter, chatbotRouter)
app.use("/poulin/:chatbot/unlike", limiter, unlikeRouter)
app.use("/poulin/:chatbot/backup", limiter, backupRouter)

const PORT = process.env.PORT || 4999
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const bus = new EventEmitter()
bus.setMaxListeners(20)
