import cors from "cors"
import dotenv from "dotenv"
import { EventEmitter } from "events"
import express from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import pkg from "pg"
import authRouter from "./poulin/auth.js"
import welcomeRouter from "./welcome.js"

import backupRouter from "./poulin/backup.js"
import chatbotRouter from "./poulin/sales-reader/chatbots.js"
import promptRouter from "./poulin/sales-reader/prompts.js"
import unlikeRouter from "./poulin/sales-reader/unlinke.js"
import usageRouter from "./poulin/sales-reader/usage.js"
import usersRouter from "./poulin/users.js"

const { Pool } = pkg

dotenv.config()

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
    rejectUnauthorized: false,
  },
})

const app = express()
app.set("trust proxy", 1)

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

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ai.dairy-tools.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.use(express.json())

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 350,
  message: { error: "Request limit reached today. Try again tomorrow." },
})

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  )
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.sendStatus(200)
})

app.use("/", welcomeRouter)
app.use("/auth", limiter, authRouter)
app.use("/usage", limiter, usageRouter)
app.use("/prompt", limiter, promptRouter)
app.use("/chatbot", limiter, chatbotRouter)
app.use("/unlike", limiter, unlikeRouter)
app.use("/backup", limiter, backupRouter)
app.use("/users", limiter, usersRouter)

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect("https://" + req.hostname + req.url)
    }
    next()
  })
}

const PORT = process.env.PORT || 4999
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const bus = new EventEmitter()
bus.setMaxListeners(20)

export default app
