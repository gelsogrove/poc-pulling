import { Router } from "express";
import { pool } from "../../../server.js";
import { validateRequest } from "../validateUser.js";
const promptProductRouter = Router();
const GetPromptHandler = async (req, res) => {
    const userId = await validateRequest(req, res);
    if (!userId)
        return;
    const { idPrompt } = req.query;
    try {
        const sql = "SELECT prompt, model, temperature, promptname FROM prompts WHERE idPrompt = $1";
        const values = [idPrompt];
        const result = await pool.query(sql, values);
        if (result.rows.length === 0) {
            res.status(404).json({ message: "Prompt non trovato.", idPrompt });
            return;
        }
        const content = result.rows[0];
        res.status(200).json({ content });
    }
    catch (error) {
        console.error("Error fetching prompt:", error);
        res.status(500).json({ message: "Errore durante la lettura del prompt." });
    }
};
const UpdatePromptHandler = async (req, res) => {
    const { userId, token } = await validateRequest(req, res);
    if (!userId)
        return;
    const { content, model, temperature, idPrompt, promptname } = req.body;
    try {
        if (content.length > 50000) {
            res
                .status(400)
                .json({ message: "Il contenuto è troppo lungo: " + content.length });
            return;
        }
        const result = await pool.query("UPDATE prompts SET prompt = $1, model = $2, temperature = $3, promptname = $4 WHERE idPrompt = $5 RETURNING *", [content, model, temperature, promptname, idPrompt]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: "Prompt non trovato" });
            return;
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error updating prompt:", error);
        res
            .status(500)
            .json({ message: "Errore durante l'aggiornamento del prompt." });
    }
};
promptProductRouter.put("/", UpdatePromptHandler);
promptProductRouter.get("/", GetPromptHandler);
export default promptProductRouter;
