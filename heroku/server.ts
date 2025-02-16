import cors from "cors"
import dotenv from "dotenv"
import { EventEmitter } from "events"
import express from "express"
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

// Aggiungiamo un log per vedere i percorsi
console.log({
  __dirname,
  rootDir,
  staticPath: path.join(rootDir, "public"),
})

// Aggiungi questo middleware prima di express.static
app.use((req, res, next) => {
  if (req.url.startsWith("/images")) {
    console.log("Static file request:", {
      url: req.url,
      physicalPath: path.join(rootDir, "public", req.url),
    })
  }
  next()
})

app.get("/images/chatbots/:filename", (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(rootDir, "public", "images", "chatbots", filename)

  console.log("Serving image:", {
    filename,
    filePath,
    exists: fs.existsSync(filePath),
  })

  res.sendFile(filePath)
})

// Usa il percorso assoluto per la directory public
const publicDir =
  process.env.NODE_ENV === "production"
    ? "/app/public"
    : path.join(__dirname, "..", "public")

// Crea la struttura delle directory
const imagesDir = path.join(publicDir, "images")
const chatbotsDir = path.join(imagesDir, "chatbots")

try {
  // Crea le directory se non esistono
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
    console.log("Created public dir:", publicDir)
  }

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
    console.log("Created images dir:", imagesDir)
  }

  if (!fs.existsSync(chatbotsDir)) {
    fs.mkdirSync(chatbotsDir, { recursive: true })
    console.log("Created chatbots dir:", chatbotsDir)
  }

  // Log della struttura creata
  console.log("Directory structure:", {
    public: {
      path: publicDir,
      exists: fs.existsSync(publicDir),
      writable: fs.accessSync(publicDir, fs.constants.W_OK),
    },
    images: {
      path: imagesDir,
      exists: fs.existsSync(imagesDir),
      writable: fs.accessSync(imagesDir, fs.constants.W_OK),
    },
    chatbots: {
      path: chatbotsDir,
      exists: fs.existsSync(chatbotsDir),
      writable: fs.accessSync(chatbotsDir, fs.constants.W_OK),
    },
  })
} catch (error) {
  console.error("Error creating directories:", error)
}

console.log("Public directory:", {
  publicDir,
  exists: fs.existsSync(publicDir),
  contents: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [],
})

// Serviamo i file statici dalla directory corretta
app.use(express.static(publicDir))

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

// Aggiungi questo endpoint prima delle altre routes
app.get("/debug/public", (req, res) => {
  const publicDir =
    process.env.NODE_ENV === "production"
      ? "/app/public"
      : path.join(__dirname, "..", "public")

  const structure = {
    publicDir,
    exists: fs.existsSync(publicDir),
    contents: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [],
    imagesDir: path.join(publicDir, "images"),
    imagesExists: fs.existsSync(path.join(publicDir, "images")),
    imagesContents: fs.existsSync(path.join(publicDir, "images"))
      ? fs.readdirSync(path.join(publicDir, "images"))
      : [],
    chatbotsDir: path.join(publicDir, "images/chatbots"),
    chatbotsExists: fs.existsSync(path.join(publicDir, "images/chatbots")),
    chatbotsContents: fs.existsSync(path.join(publicDir, "images/chatbots"))
      ? fs.readdirSync(path.join(publicDir, "images/chatbots"))
      : [],
  }

  res.json(structure)
})

// Endpoint per verificare i file nella directory chatbots
app.get("/debug/chatbots", (req, res) => {
  const chatbotsDir =
    process.env.NODE_ENV === "production"
      ? "/app/public/images/chatbots"
      : path.join(__dirname, "..", "public/images/chatbots")

  try {
    const files = fs.readdirSync(chatbotsDir)
    const filesDetails = files.map((file) => {
      const filePath = path.join(chatbotsDir, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        path: filePath,
        exists: fs.existsSync(filePath),
      }
    })

    res.json({
      directory: chatbotsDir,
      exists: fs.existsSync(chatbotsDir),
      files: filesDetails,
    })
  } catch (err: any) {
    res.json({
      error: err.message,
      directory: chatbotsDir,
      exists: fs.existsSync(chatbotsDir),
    })
  }
})

const PORT = process.env.PORT || 4999
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const bus = new EventEmitter()
bus.setMaxListeners(20)
