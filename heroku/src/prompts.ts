import { RequestHandler, Response, Router } from "express"
import fs from "fs/promises"
import { getUserIdByToken } from "./validateUser.js"

const promptRouter = Router()
const PROMPT_FILE = "/app/heroku/dist/src/assets/prompt.txt"

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

const UpdatePromptHandler: RequestHandler = async (req, res) => {
  try {
    const { content, token } = req.body

    if (!(await validateToken(token, res))) return

    if (content.length > 10000) {
      res.status(400).json({ message: "Il contenuto è troppo lungo" })
      return
    }

    await fs.copyFile(PROMPT_FILE, `${PROMPT_FILE}.backup`)

    const tempFile = `${PROMPT_FILE}.temp`
    await fs.writeFile(tempFile, content, { flag: "w" })

    await fs.rename(tempFile, PROMPT_FILE)

    await fs.unlink(tempFile)

    res.status(200).json("ok")
  } catch (error) {
    console.error(error)
    res.status(500).json("Errore durante la scrittura del prompt" + error)
  }
}

const GetPromptHandler: RequestHandler = async (req, res) => {
  try {
    console.log(PROMPT_FILE)
    const content = await fs.readFile(PROMPT_FILE, "utf-8")
    res.status(200).json({ content })
  } catch (error) {
    res.status(500).json("Errore durante la scrittura del prompt" + error)
  }
}

promptRouter.put("/", UpdatePromptHandler)
promptRouter.get("/", GetPromptHandler)

export default promptRouter
