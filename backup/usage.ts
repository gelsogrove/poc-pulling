import { Router } from "express"
import { pool } from "../server.js" // Importa il pool dal file principale

const usageRouter = Router()

// Endpoint per aggiungere un utilizzo
usageRouter.post("/", async (req, res) => {
  const { day, total, user, service } = req.body

  // Verifica che tutti i campi necessari siano presenti
  if (!day || !total || !user || !service) {
    res
      .status(400)
      .json({ error: "Day, total, user, and service are required." })
    return
  }

  try {
    // Modifica la query per includere i nuovi campi 'user' e 'service'...
    const result = await pool.query(
      'INSERT INTO usage (day, total, "user", service) VALUES ($1, $2, $3, $4) RETURNING *',
      [day, total, user, service]
    )
    // Restituisce la riga appena inserita
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error inserting usage data:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

usageRouter.get("/", async (req, res) => {
  try {
    // Query per il totale giornaliero
    const dayResult = await pool.query(`
      SELECT total 
      FROM usage 
      WHERE day = CURRENT_DATE
    `)

    // Calculate the current week's Monday
    const currentMonday = new Date()
    currentMonday.setDate(currentMonday.getDate() - currentMonday.getDay() + 1) // Set to Monday of the current week
    const startOfWeek = currentMonday.toISOString().split("T")[0] // Format as YYYY-MM-DD

    // Query for the current week's days (currentWeek)
    const lastweekResult = await pool.query(`
      SELECT 
        to_char(series.day, 'Day') AS weekday, 
        COALESCE(usage.total, 0) AS total
      FROM generate_series(
        '${startOfWeek}'::date, 
        '${startOfWeek}'::date + INTERVAL '6 days', 
        '1 day'
      ) AS series(day)
      LEFT JOIN usage ON usage.day = series.day
      ORDER BY series.day
    `)

    // Reorder the results to start from Monday and include only days from the current week
    const reorderedDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]
    const currentWeek = reorderedDays.map((day) => {
      const dayData = lastweekResult.rows.find(
        (row) => row.weekday.trim() === day
      )
      return {
        day: dayData?.weekday.trim(),
        total: dayData?.total || "0",
      }
    })

    // Calculate totalCurrentWeek by summing the totals from currentWeek
    const totalCurrentWeek = currentWeek.reduce(
      (sum, day) => sum + parseFloat(day.total),
      0
    )

    // Query per gli ultimi 12 mesi (lastmonths)
    const lastmonthsResult = await pool.query(`
      SELECT 
        to_char(series.month, 'Month') AS month, 
        to_char(series.month, 'YYYY') AS year,
        COALESCE(SUM(usage.total), 0) AS total 
      FROM generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '11 months', 
        date_trunc('month', CURRENT_DATE), 
        '1 month'
      ) AS series(month)
      LEFT JOIN usage ON date_trunc('month', usage.day) = series.month
      GROUP BY series.month, year
      ORDER BY series.month
    `)

    // Query for the total for the current month (totalCurrentMonth)
    const currentMonthResult = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM usage
      WHERE date_trunc('month', day) = date_trunc('month', CURRENT_DATE)
    `)
    const totalCurrentMonth = currentMonthResult.rows[0]?.total || 0

    // Struttura i dati per la risposta
    const day = dayResult.rows[0]?.total || "0.00"

    const lastmonths = lastmonthsResult.rows.map((row) => ({
      month: row.month.trim(), // Nome del mese
      year: row.year, // Anno
      total: row.total || "0",
    }))

    res.json({
      day,
      currentWeek,
      totalCurrentWeek,
      totalCurrentMonth,
      lastmonths,
    })
  } catch (error) {
    console.error("Error fetching usage data:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint per aggiornare un utilizzo
usageRouter.put("/:id", async (req, res) => {
  const { id } = req.params
  const { day, total } = req.body

  if (!day || !total) {
    res.status(400).json({ error: "Day and total are required." })
    return
  }

  try {
    const result = await pool.query(
      "UPDATE usage SET day = $1, total = $2 WHERE idusage = $3 RETURNING *",
      [day, total, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usage not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error updating usage data:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint per eliminare un utilizzo
usageRouter.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query("DELETE FROM usage WHERE idusage = $1", [
      id,
    ])
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usage not found." })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting usage data:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default usageRouter
