import { Request, Response, Router } from "express"
import { pool } from "../server.js" // Importa il pool dal file principale
import { getUserIdByToken, validateUser } from "./validateUser.js"

const usageRouter = Router()

/**
 * Funzione generica per validare il token e l'utente.
 */
const validateRequest = async (
  req: Request,
  res: Response
): Promise<string | null> => {
  const authHeader = req.headers["authorization"] as string | undefined
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null

  if (!token) {
    res.status(401).json({ message: "Missing or invalid token." })
    return null
  }

  try {
    const userId = await getUserIdByToken(token)
    if (!userId) {
      res.status(403).json({ message: "Invalid or expired token." })
      return null
    }

    const isUserValid = await validateUser(userId)
    if (!isUserValid) {
      res.status(403).json({ message: "User is not authorized." })
      return null
    }

    return userId
  } catch (error) {
    console.error(
      "Error during token validation:",
      error instanceof Error ? error.message : error
    )
    res
      .status(500)
      .json({ message: "Internal server error during validation." })
    return null
  }
}

/**
 * Endpoint per creare un nuovo record di utilizzo.
 */
usageRouter.post("/new", async (req, res) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { day, total, service } = req.body

  try {
    const query =
      'INSERT INTO usage (day, total, "user", service) VALUES ($1, $2, $3, $4) RETURNING *'
    const values = [day, total, userId, service]

    const result = await pool.query(query, values)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error during insertion:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * Endpoint per ottenere il totale giornaliero, settimanale e mensile.
 */
usageRouter.post("/", async (req, res) => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  try {
    const dayResult = await pool.query(
      `
      SELECT total 
      FROM usage 
      WHERE day = CURRENT_DATE AND "user" = $1
    `,
      [userId]
    )

    const currentMonday = new Date()
    currentMonday.setDate(currentMonday.getDate() - currentMonday.getDay() + 1)
    const startOfWeek = currentMonday.toISOString().split("T")[0]

    const lastweekResult = await pool.query(
      `
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
    `
    )

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

    const totalCurrentWeek = currentWeek.reduce(
      (sum, day) => sum + parseFloat(day.total),
      0
    )

    const lastmonthsResult = await pool.query(
      `
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
    `
    )

    const currentMonthResult = await pool.query(
      `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM usage
      WHERE date_trunc('month', day) = date_trunc('month', CURRENT_DATE)
    `
    )
    const totalCurrentMonth = currentMonthResult.rows[0]?.total || 0

    const day = dayResult.rows[0]?.total || "0.00"

    const lastmonths = lastmonthsResult.rows.map((row) => ({
      month: row.month.trim(),
      year: row.year,
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
    console.error(
      "Error during retrieval:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error." })
  }
})

/**
 * Gestione degli errori.
 */
usageRouter.use((err: any, req: Request, res: Response, next: Function) => {
  if (err && err.status === 429) {
    res.status(429).json({ error: "Request limit reached. Try again later." })
  } else {
    next(err)
  }
})

export default usageRouter
