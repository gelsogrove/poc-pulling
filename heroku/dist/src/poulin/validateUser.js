import { pool } from "../../server.js";
/**
 * Valida un utente controllando se esiste e se la sua sottoscrizione è valida.
 * @param userId - L'ID dell'utente da validare
 * @returns `true` se l'utente è valido, altrimenti lancia un'eccezione
 */
export const validateUser = async (userId) => {
    try {
        const result = (await pool.query(`SELECT expire_date FROM users WHERE userid = $1`, [userId]));
        if (result.rowCount === 0) {
            throw new Error("User not found.");
        }
        const expireDate = result.rows[0].expire_date;
        if (new Date(expireDate) < new Date()) {
            throw new Error("User subscription has expired.");
        }
        return true; // L'utente esiste e la data di scadenza è valida
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Validation error: ${error.message}`);
        }
        throw new Error("An unknown error occurred");
    }
};
/**
 * Ottiene l'ID dell'utente associato a un token.
 * @param token - Il token da validare
 * @returns L'ID dell'utente se valido, altrimenti `null`
 */
export const getUserIdByToken = async (token) => {
    try {
        const result = (await pool.query(`SELECT userid FROM users WHERE token = $1`, [token]));
        if (result?.rowCount && result.rowCount > 0) {
            return result.rows[0].userid;
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.error("Error in getUserIdByToken:", error);
        return null;
    }
};
export const extractValuesFromPrompt = (prompt) => {
    try {
        const temperatureMatch = prompt.match(/TEMPERATURE:\s*([0-9.]+)/i);
        const modelMatch = prompt.match(/MODEL:\s*([a-zA-Z0-9\-_.:/]+)/i); // Include ':' e '/' per modelli complessi
        const temperature = temperatureMatch
            ? parseFloat(temperatureMatch[1])
            : null;
        const model = modelMatch ? modelMatch[1] : null;
        return { temperature, model };
    }
    catch (error) {
        console.error("Error extracting values from prompt:", error);
        return { temperature: null, model: null };
    }
};
export const validateRequest = async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    if (!token) {
        res.status(401).json({ message: "Missing or invalid token." });
        return null;
    }
    try {
        const userId = await getUserIdByToken(token);
        if (!userId) {
            res.status(403).json({ message: "Invalid or expired token." });
            return null;
        }
        return { userId, token };
    }
    catch (error) {
        console.error("Error during token validation:", error instanceof Error ? error.message : error);
        res
            .status(500)
            .json({ message: "Internal server error during validation." });
        return null;
    }
};
export const validateToken = async (token) => {
    try {
        const userId = await getUserIdByToken(token);
        if (!userId) {
            return null;
        }
        return userId;
    }
    catch (error) {
        return null;
    }
};
