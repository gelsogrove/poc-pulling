import { Request, Response, Router } from "express"

const welcomeRouter = Router()

welcomeRouter.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the server!")
})

export default welcomeRouter
