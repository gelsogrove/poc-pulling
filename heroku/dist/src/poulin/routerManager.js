import { Router } from "express";
import chatbotMainRouter from "./chatbots/main/chatbots.js";
import { promptMainRouter, unlikeOrdersRouter, usageMainRouter, } from "./share/index.js";
const router = Router();
// Funzione per registrare le rotte
const registerRoute = (path, routerInstance) => {
    router.use(path, routerInstance);
};
// Registrazione delle rotte
registerRoute("/main", chatbotMainRouter);
registerRoute("/usage", usageMainRouter);
registerRoute("/prompt", promptMainRouter);
registerRoute("/unlike", unlikeOrdersRouter);
export const chatbotRouter = router.use("/main", chatbotMainRouter);
export const usageRouter = router.use("/usage", usageMainRouter);
export const promptRouter = router.use("/prompt", promptMainRouter);
export const unlikeRouter = router.use("/unlike", unlikeOrdersRouter);
export default router;
