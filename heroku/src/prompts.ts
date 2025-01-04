import { RequestHandler, Response, Router } from "express"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { getUserIdByToken } from "./validateUser.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const promptRouter = Router()
const PROMPT_DIR = process.env.PROMPT_DIR || "/app/data"
const PROMPT_FILE = path.join(PROMPT_DIR, "prompt.txt")

const validateToken = async (
  token: string,
  res: Response
): Promise<string | null> => {
  const userId = await getUserIdByToken(token)
  if (!userId) {
    res.status(400).json({ message: "Token non valido" })
    return null
  }
  return userId
}

const ensureDirectoryExists = async (filePath: string) => {
  const dir = path.dirname(filePath)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

const UpdatePromptHandler: RequestHandler = async (req, res) => {
  try {
    const { content, token } = req.body

    if (!(await validateToken(token, res))) return

    if (content.length > 10000) {
      res.status(400).json({ message: "Il contenuto è troppo lungo" })
      return
    }

    await ensureDirectoryExists(PROMPT_FILE)

    const backupFile = `${PROMPT_FILE}.backup`
    try {
      await fs.access(PROMPT_FILE)
      await fs.copyFile(PROMPT_FILE, backupFile)
    } catch {
      console.warn(
        `Il file originale ${PROMPT_FILE} non esiste, non può essere copiato nel backup.`
      )
    }

    const tempFile = `${PROMPT_FILE}.temp`
    await fs.writeFile(tempFile, content, { flag: "w" })

    await fs.rename(tempFile, PROMPT_FILE)

    try {
      await fs.access(tempFile)
      await fs.unlink(tempFile)
    } catch {
      console.warn(
        `Il file temporaneo ${tempFile} non esiste, non può essere eliminato.`
      )
    }

    try {
      await fs.access(backupFile)
      await fs.unlink(backupFile)
    } catch {
      console.warn(
        `Il file di backup ${backupFile} non esiste, non può essere eliminato.`
      )
    }

    res.status(200).json("ok")
  } catch (error) {
    console.error(error)
    res.status(500).json("Errore durante la scrittura del prompt" + error)
  }
}

const GetPromptHandler: RequestHandler = async (req, res) => {
  try {
    await ensureDirectoryExists(PROMPT_FILE)

    try {
      await fs.access(PROMPT_FILE)
    } catch {
      await fs.writeFile(PROMPT_FILE, "", { flag: "w" })
    }

    const content = await fs.readFile(PROMPT_FILE, "utf-8")
    res.status(200).json({ content })
  } catch (error) {
    res.status(500).json("Errore durante la lettura del prompt" + error)
  }
}

promptRouter.put("/", UpdatePromptHandler)
promptRouter.get("/", GetPromptHandler)

export default promptRouter
