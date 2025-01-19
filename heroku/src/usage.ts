import { ErrorRequestHandler, Response, Router } from "express"
import { pool } from "../server.js" // Importa il pool dal file principale
import { getUserIdByToken, validateUser } from "./validateUser.js"

const usageRouter = Router()

const validateToken = async (
  token: string,
  res: Response
): Promise<string | null> => {
  const userId = await getUserIdByToken(token)
  if (!userId) {
    res.status(400).json({ message: "Token non valido" })
    return null
  }
  return userId
}

// Endpoint per aggiungere un utilizzo
usageRouter.post("/new", async (req, res) => {
  const { day, total, token, service } = req.body

  try {
    //Convert token to userId
    const userId = await validateToken(token, res)
    if (!userId) return

    await validateUser(userId)

    const result = await pool.query(
      'INSERT INTO usage (day, total, "user", service) VALUES ($1, $2, $3, $4) RETURNING *',
      [day, total, userId, service]
    )
    res.status(201).json(result)
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: "Internal server error" })
    }
  }
})

usageRouter.post("/", async (req, res) => {
  const { token } = req.body

  try {
    //Convert token to userId
    const userId = await validateToken(token, res)
    if (!userId) return

    await validateUser(userId as string)

    // Query per il totale giornaliero
    const dayResult = await pool.query(
      `
      SELECT total 
      FROM usage 
      WHERE day = CURRENT_DATE AND "user" = $1
    `,
      [userId]
    )

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
    if (error instanceof Error) {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: "Internal server error" })
    }
  }
})

// Endpoint per aggiornare un utilizzo
usageRouter.put("/:id", async (req, res) => {
  const { id } = req.params
  const { day, total, token } = req.body

  //Convert token to userId
  const userId = await validateToken(token, res)
  if (!userId) return

  if (!day || !total) {
    res.status(400).json({ error: "Day and total are required." })
    return
  }

  try {
    await validateUser(userId)

    const result = await pool.query(
      'UPDATE usage SET day = $1, total = $2 WHERE idusage = $3 AND "user" = $4 RETURNING *',
      [day, total, id, userId]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usage not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: "Internal server error" })
    }
  }
})

// Endpoint per eliminare un utilizzo
usageRouter.delete("/:id", async (req, res) => {
  const { id } = req.params
  const { token } = req.body

  try {
    //Convert token to userId
    const userId = await validateToken(token, res)
    if (!userId) return

    await validateUser(userId)

    const result = await pool.query(
      'DELETE FROM usage WHERE idusage = $1 AND "user" = $2',
      [id, userId]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usage not found." })
      return
    }
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: "Internal server error" })
    }
  }
})

// Endpoint per ottenere il totale per ogni mese
usageRouter.post("/monthly-totals", async (req, res) => {
  const { token } = req.body

  try {
    //Convert token to userId
    const userId = await validateToken(token, res)
    if (!userId) return

    await validateUser(userId as string)

    const monthlyResult = await pool.query(
      `
      SELECT 
        service, 
        to_char(date_trunc('month', day), 'YYYY') AS year, 
        to_char(date_trunc('month', day), 'MM') AS month, 
        COALESCE(SUM(total), 0) AS total 
      FROM usage 
      GROUP BY service, date_trunc('month', day) 
      ORDER BY service, year DESC, month DESC
      LIMIT 12
    `
    )

    // Struttura i dati per la risposta
    const monthlyTotals = monthlyResult.rows.map((row) => ({
      service: row.service,
      year: row.year,
      month: row.month,
      total: row.total || 0,
      paid: false, // Imposta paid a false per default
    }))

    res.json(monthlyTotals)
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: "Internal server error" })
    }
  }
})

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err && err.status === 429) {
    res.status(429).json({ error: "Request limit reached. Try again later." })
  } else {
    next(err)
  }
}

usageRouter.use(errorHandler)

export default usageRouter
