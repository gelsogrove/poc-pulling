import { Router } from "express";
import { pool } from "../../../server.js";
import { validateRequest } from "../share/validateUser.js";
const router = Router();
const getUnlikeHandler = async (req, res) => {
    const { userId, token } = await validateRequest(req, res);
    if (!userId)
        return;
    const { idPrompt } = req.query;
    try {
        const sql = "SELECT * FROM unlike WHERE idPrompt = $1";
        const values = [idPrompt];
        const result = await pool.query(sql, values);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Error fetching unlike data:", error);
        res.status(500).json({ message: "Error retrieving unlike data" });
    }
};
router.get("/", getUnlikeHandler);
export default router;
