import cors from "cors";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import pkg from "pg";
import { fileURLToPath } from "url";
import unlikeRouter from "./src/poulin/share/unlike.js";
import usageRouter from "./src/poulin/share/usage.js";
import chatbotMainRouter from "./src/poulin/chatbots/main/chatbots.js";
import { chatbotWebhookRouter } from "./src/poulin/chatbots/main/index.js";
import historyRouter from "./src/poulin/share/history.js";
import promptRouter from "./src/poulin/share/prompts.js";
import usersRouter from "./src/poulin/users.js";
import authRouter from "./src/poulin/utility/auth.js";
import backupRouter from "./src/poulin/utility/backup.js";
import modelsRouter from "./src/poulin/utility/models.js";
import monthlyUsageRouter from "./src/poulin/utility/monthlyUsage.js";
import promptsManagerRouter from "./src/poulin/utility/promptsManager.js";
import modelrolesRouter from "./src/poulin/utility/roles.js";
import { receiveMessage, verifyWebhook } from "./src/poulin/webhook.js";
import welcomeRouter from "./welcome.js";
const { Pool } = pkg;
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Database connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "",
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});
// Limiter to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // limite di 100 richieste per windowMs
});
const app = express();
// Configura Express per fidarsi del proxy di Heroku
app.set("trust proxy", 1);
// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    // Pass the pool to the routes
    req.app.locals.pool = pool;
    next();
});
app.use((error, req, res, next) => {
    return res.status(500).json({
        error: error.toString(),
    });
});
app.use("/", welcomeRouter);
app.use("/auth", limiter, authRouter);
app.use("/users", limiter, usersRouter);
app.use("/usage", limiter, usageRouter);
app.use("/monthly-usage", limiter, monthlyUsageRouter);
app.use("/models", limiter, modelsRouter);
app.get("/webhook/receive", verifyWebhook);
app.post("/webhook/receive", receiveMessage);
app.use("/roles", limiter, modelrolesRouter);
app.use("/prompts", limiter, promptsManagerRouter);
app.use("/poulin/main/history", limiter, historyRouter);
app.use("/poulin/main/prompt", limiter, promptRouter);
app.use("/poulin/main/chatbot", limiter, chatbotMainRouter);
app.use("/poulin/main/chatbot-webhook", limiter, chatbotWebhookRouter);
app.use("/poulin/main/unlike", limiter, unlikeRouter);
app.use("/poulin/main/backup", limiter, backupRouter);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const bus = new EventEmitter();
bus.setMaxListeners(20);
