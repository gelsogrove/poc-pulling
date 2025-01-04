import { RequestHandler, Response, Router } from "express"
import { getUserIdByToken } from "./validateUser.js"

import { processText } from "./utils/extract-entities.js"

const chatbotRouter = Router()

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

const initializeHandler: RequestHandler = async (req, res) => {
  const { conversationId, token } = req.body

  try {
    if (!(await validateToken(token, res))) return

    res.status(200).json("OK")
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
}

const respHandler: RequestHandler = async (req, res) => {
  const { conversationId, token, message } = req.body

  try {
    if (!(await validateToken(token, res))) return

    // REDIS CREATE TEMPORALLY MAP FOR THE CONVERSATION ID

    //PROCESSED MESSAGE
    const { fakeText, formattedEntities } = processText(message)

    //REVERT MESSAGE
    const originalText = restoreOriginalText(fakeText, formattedEntities)

    res.status(200).json("ok")
  } catch (error) {
    res.status(500).json(error)
  }
}

chatbotRouter.post("/initialize", initializeHandler)
chatbotRouter.post("resp", respHandler)

export default chatbotRouter
