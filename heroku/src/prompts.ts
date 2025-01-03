import { RequestHandler, Router } from "express"
import fs from "fs/promises"
import { register } from "node:module"
import { pathToFileURL } from "node:url"
import path from "path"
register("ts-node/esm", pathToFileURL("./"))

// Define __dirname for ES module
const __dirname = path.dirname(new URL(import.meta.url).pathname)

const promptRouter = Router()
const PROMPT_FILE = path.join(__dirname, "assets", "prompt.txt")

const UpdatePromptHandler: RequestHandler = async (req, res) => {
  try {
    const { content, token } = req.body

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
    res.status(500).json("Errore durante la scrittura del prompt")
  }
}

const GetPromptHandler: RequestHandler = async (req, res) => {
  const { token } = req.body

  try {
    const content = await fs.readFile(PROMPT_FILE, "utf-8")
    res.status(200).json({ content })
  } catch (error) {
    res.status(500).json("Errore durante la lettura del prompt")
  }
}

promptRouter.put("/", UpdatePromptHandler)
promptRouter.post("/", GetPromptHandler)

export default promptRouter
