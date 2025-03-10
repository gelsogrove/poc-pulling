import { Router } from "express";
import { pool } from "../../../server.js";
import { validateRequest } from "../share/validateUser.js";
const rolesRouter = Router();
// Funzione per creare un nuovo ruolo
const createRole = async (req, res) => {
    const { userId, token } = await validateRequest(req, res);
    if (!userId)
        return;
    // Verifica se l'utente è admin
    const userCheck = await pool.query("SELECT role FROM users WHERE userid = $1", [userId]);
    if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
        res.status(403).json({ error: "Only admin users can manage roles" });
        return;
    }
    const { role } = req.body;
    if (!role) {
        res.status(400).json({ error: "Il campo 'role' non può essere nullo." });
        return;
    }
    try {
        const result = await pool.query("INSERT INTO Roles (role) VALUES ($1) RETURNING *", [role]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error creating role:", error);
        res.status(500).json({ error: "Errore durante la creazione del ruolo." });
    }
};
// Funzione per ottenere tutti i ruoli
const getRoles = async (req, res) => {
    const { userId, token } = await validateRequest(req, res);
    if (!userId)
        return;
    // Verifica se l'utente è admin
    const userCheck = await pool.query("SELECT role FROM users WHERE userid = $1", [userId]);
    if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
        res.status(403).json({ error: "Only admin users can manage roles" });
        return;
    }
    try {
        const result = await pool.query("SELECT * FROM roles ORDER BY idrole DESC");
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Error fetching roles:", error);
        res.status(500).json({ error });
    }
};
// Funzione per aggiornare un ruolo esistente
const updateRole = async (req, res) => {
    const { userId, token } = await validateRequest(req, res);
    if (!userId)
        return;
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
        res.status(400).json({ error: "Il campo 'role' non può essere nullo." });
        return;
    }
    try {
        const result = await pool.query("UPDATE Roles SET role = $1 WHERE idrole = $2 RETURNING *", [role, id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Ruolo non trovato." });
            return;
        }
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error });
    }
};
const deleteRole = async (req, res) => {
    const { userId, token } = await validateRequest(req, res);
    if (!userId)
        return;
    const { idrole } = req.params;
    try {
        // 1. Verifica se il ruolo è in uso nella tabella users
        const userCheck = await pool.query(`
      SELECT COUNT(u.*)
      FROM roles r
      LEFT JOIN users u ON u.role = r.role
      WHERE r.idrole = $1
    `, [idrole]);
        if (parseInt(userCheck.rows[0].count) > 0) {
            res.status(400).json({ error: "Cannot delete role because it is in use" });
            return;
        }
        // 2. Verifica se è l'ultimo ruolo Admin
        const roleCheck = await pool.query(`
      SELECT role 
      FROM roles 
      WHERE idrole = $1
    `, [idrole]);
        if (roleCheck.rows[0]?.role.toLowerCase() === "admin") {
            const adminCount = await pool.query(`
        SELECT COUNT(*) 
        FROM roles 
        WHERE LOWER(role) = 'admin'
      `);
            if (parseInt(adminCount.rows[0].count) <= 1) {
                res.status(400).json({ error: "Cannot delete the last Admin role" });
                return;
            }
        }
        // 3. Procedi con la cancellazione
        const result = await pool.query("DELETE FROM roles WHERE idrole = $1", [
            idrole,
        ]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Role not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting role:", error);
        res.status(500).json({ error: "Error while deleting role" });
    }
};
// Definizione delle rotte
rolesRouter.post("/new", createRole);
rolesRouter.get("/", getRoles);
rolesRouter.put("/update/:id", updateRole);
rolesRouter.delete("/delete/:idrole", deleteRole);
export default rolesRouter;
