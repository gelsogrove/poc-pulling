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

// Aggiungi import per WhatsApp BuilderBot
import {
  addKeyword,
  createBot,
  createFlow,
  createProvider,
  MemoryDB,
} from "@builderbot/bot"
import { BaileysProvider } from "@builderbot/provider-baileys"
// @ts-ignore
import axios from "axios"
import qrcode from "qrcode-terminal"

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
import { whatsappMiddleware } from "./src/poulin/whatsapp-proxy.js"
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

// WhatsApp configuration *********************************************
const PORT = process.env.PORT || 4999

const WHATSAPP_DEFAULT_PROMPT =
  process.env.WHATSAPP_DEFAULT_PROMPT || "whatsapp-default"

// Funzione per inizializzare WhatsApp
async function initializeWhatsApp(): Promise<boolean> {
  try {
    console.log("Inizializzazione WhatsApp con BuilderBot...")

    // Flow che cattura qualsiasi messaggio
    const catchAllFlow = addKeyword(".*").addAction(async (ctx: any) => {
      const phoneNumber = ctx.from.split("@")[0]
      const messageText = ctx.body

      console.log(
        `Messaggio ricevuto da WhatsApp: ${phoneNumber}: ${messageText}`
      )

      try {
        // Inoltra al chatbot esistente
        await axios.post(
          `http://localhost:${PORT}/poulin/main/chatbot/response`,
          {
            conversationId: `whatsapp-${phoneNumber}`,
            idPrompt: WHATSAPP_DEFAULT_PROMPT,
            message: { role: "user", content: messageText },
            whatsappNumber: phoneNumber, // Marker per identificare origine WhatsApp
          }
        )
      } catch (error) {
        console.error("Errore nell'inoltro del messaggio al chatbot:", error)
      }
    })

    // Configura Baileys provider con supporto sessioni persistenti
    const whatsappProvider = createProvider(BaileysProvider, {
      sessionPath: "./whatsapp-session",
      printQRInTerminal: true,
      qrcode: {
        generate: (qr: string) => {
          console.log("Scansiona questo codice QR con WhatsApp (+34654728753):")
          qrcode.generate(qr, { small: true })
        },
      },
    })

    // Setup BuilderBot
    const adapterDB = new MemoryDB()
    const adapterFlow = createFlow([catchAllFlow])

    // Crea il bot
    await createBot({
      flow: adapterFlow,
      provider: whatsappProvider as any,
      database: adapterDB,
    })

    // Esponi il provider per gli endpoint send
    global.whatsappProvider = whatsappProvider
    global.whatsappInitialized = true

    console.log("WhatsApp inizializzato con successo")
    return true
  } catch (error) {
    console.error("Errore nell'inizializzazione di WhatsApp:", error)
    return false
  }
}

// Utilizza il middleware WhatsApp (aggiungi prima degli altri middleware)
app.use(whatsappMiddleware)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  // Inizializza WhatsApp
  initializeWhatsApp()
    .then((success) => {
      if (success) {
        console.log("WhatsApp inizializzato e pronto a ricevere messaggi")
        console.log("Numero WhatsApp configurato: +34654728753")
      } else {
        console.error("Errore nell'inizializzazione di WhatsApp")
      }
    })
    .catch((err) => console.error("Errore critico WhatsApp:", err))
})

const bus = new EventEmitter()
bus.setMaxListeners(20)
