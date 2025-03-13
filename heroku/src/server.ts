import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import path from "path"
import { fileURLToPath } from "url"
import { LoggerService } from "./domain/services/LoggerService.js"
import { DependencyInjection } from "./infrastructure/config/dependencyInjection.js"
import { createWebhookRoutes } from "./interfaces/api/routes/webhookRoutes.js"

// Carica le variabili d'ambiente
dotenv.config()

// Configurazione dei percorsi
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Limiter per prevenire abusi
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // Max 100 richieste per finestra
  message: "Troppe richieste da questo IP, riprova più tardi.",
})

// Inizializza l'applicazione Express
const app = express()

// Configura Express per fidarsi del proxy di Heroku
app.set("trust proxy", 1)

// Middleware di sicurezza
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware per la gestione degli errori
app.use((error: any, req: any, res: any, next: any) => {
  LoggerService.error("Errore non gestito", error)
  return res.status(500).json({
    error: error.toString(),
  })
})

// Rotta di benvenuto
app.get("/", (req, res) => {
  res.send("Webhook Service - Poulin DDD")
})

// Configura le rotte in modo asincrono
const initializeRoutes = async () => {
  try {
    // Configura il controller del webhook
    const webhookController =
      await DependencyInjection.configureWebhookController()

    // Crea le rotte del webhook
    const webhookRoutes = createWebhookRoutes(webhookController)

    // Registra le rotte
    app.use("/webhook", limiter, webhookRoutes)
    app.use("/poulin/main/chatbot-webhook", limiter, webhookRoutes)

    LoggerService.info("Rotte configurate con successo")
  } catch (error) {
    LoggerService.error("Errore nella configurazione delle rotte", error)
  }
}

// Avvia il server
const PORT = process.env.PORT || 4999

// Inizializza in modo asincrono e avvia il server
initializeRoutes()
  .then(() => {
    app.listen(PORT, () => {
      LoggerService.info(`Server in esecuzione sulla porta ${PORT}`)
    })
  })
  .catch((error) => {
    LoggerService.error(
      "Errore critico nell'inizializzazione del server",
      error
    )
  })
