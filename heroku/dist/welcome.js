import { Router } from "express";
const welcomeRouter = Router();
welcomeRouter.get("/", (req, res) => {
    res.send("Welcome to the server!");
});
export default welcomeRouter;
