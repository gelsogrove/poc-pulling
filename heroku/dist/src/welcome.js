import { Router } from "express";
const welcomeRouter = Router();
welcomeRouter.get("/", (req, res) => {
    res.json({ message: "Welcome to the API" });
});
export default welcomeRouter;
