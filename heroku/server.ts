import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import pkg from "pg"
import authRouter from "./src/auth.js"
import usageRouter from "./src/usage.js" // Aggiungi .js
import welcomeRouter from "./src/welcome.js" // Aggiungi .js
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

// Inizializza l'app Express
const app = express()

// Abilita il trust per i proxy (necessario per Heroku e express-rate-limit)
app.set("trust proxy", 1)

// Configurazioni di sicurezza con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      /*
      directives: {
        defaultSrc: ["'self'"], // Permetti solo risorse dallo stesso dominio
        scriptSrc: ["'self'", "https://trusted.cdn.com"], // Aggiungi domini fidati per gli script
        styleSrc: ["'self'", "https://trusted.cdn.com"], // Aggiungi domini fidati per gli stili
        imgSrc: ["'self'", "data:", "https://trusted.cdn.com"], // Permetti immagini dal tuo dominio e da un CDN
        connectSrc: ["'self'", "https://api.trusted.com"], // Permetti connessioni a un'API fidata
        // Aggiungi altre direttive se necessario
      },
      */
    },
  })
)

app.use(
  cors({
    origin: ["http://localhost:3000"], // Aggiungi più domini se necessario
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
  max: 150, // 100 richieste al giorno
  message: { error: "Request limit reached today. Try again tomorrow." },
})

// Usa i vari router
app.use("/", welcomeRouter) // Router di benvenuto
app.use("/auth", authRouter) // Router di autenticazione
app.use("/usage", limiter, usageRouter) // Router per utilizzo con limiter

// Forza HTTPS in produzione
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.hostname + req.url)
    }
    next()
  })
}

// Porta per avviare il server
const PORT = process.env.PORT || 4999
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
