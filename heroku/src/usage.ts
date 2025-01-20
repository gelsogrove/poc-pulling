import { Router } from "express"
import { pool } from "../server.js" // Assumi che il pool sia configurato

const unlikeRouter = Router()

// Endpoint per inserire un record nella tabella "unlike"
unlikeRouter.post("/new", async (req, res) => {
  const { conversationId, msgId, dataTime } = req.body

  // Validazione input
  if (!conversationId || !msgId || !dataTime) {
    return res.status(400).json({ error: "All fields are required." })
  }

  try {
    // Query per inserire il record
    const query = `
      INSERT INTO unlike (conversationId, msgId, dataTime)
      VALUES ($1, $2, $3)
      RETURNING idUnlike, conversationId, msgId, dataTime
    `
    const values = [conversationId, msgId, dataTime]

    // Esegui la query
    const result = await pool.query(query, values)

    // Restituisci il risultato
    res.status(201).json({
      message: "Record inserted successfully",
      data: result.rows[0], // Restituisce il record inserito
    })
  } catch (error) {
    console.error("Error inserting record:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default unlikeRouter
