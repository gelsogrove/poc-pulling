import { Request, Response, Router } from "express"
const modelWebooksRouter = Router()

async function receiveMessage(req: Request, res: Response) {
  try {
    res.status(500).json("*****receiveMessage ****")
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ error: "Internal server error." })
  }
}

modelWebooksRouter.put("/receive", receiveMessage)

export default modelWebooksRouter
