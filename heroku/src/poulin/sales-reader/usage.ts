import { Request, Response, Router } from "express"

import { pool } from "../../../server.js"
import { validateRequest } from "../validateUser.js"

const usageRouter = Router()

const createUsageHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { day, total, service, idprompt } = req.body

  try {
    const query =
      "INSERT INTO usage (day, total, service, idprompt,userid) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    const values = [day, total, service, idprompt, userId]

    const result = await pool.query(query, values)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(
      "Error during insertion:",
      error instanceof Error ? error.message : error
    )
    res.status(500).json({ error: "Internal server error." })
  }
}

const getUsageHandler = async (req: Request, res: Response): Promise<void> => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  try {
    const sql = `
      SELECT total 
      FROM usage 
      WHERE day = CURRENT_DATE AND userid = $1
    `
    console.log("sql", sql)
    const dayResult = await pool.query(sql, [userId])

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
        (row: any) => row.weekday.trim() === day
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

    const lastmonths = lastmonthsResult.rows.map((row: any) => ({
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
}

const updateUsageHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params
  const { day, total } = req.body

  if (!day || !total) {
    res.status(400).json({ error: "Day and total are required." })
    return
  }

  try {
    const result = await pool.query(
      "UPDATE usage SET day = $1, total = $2 WHERE idusage = $3 AND userid = $4 RETURNING *",
      [day, total, id, userId]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usage not found." })
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error("Error during update:", error)
    res.status(500).json({ error: "Internal server error." })
  }
}

const deleteUsageHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params

  try {
    const result = await pool.query(
      "DELETE FROM usage WHERE idusage = $1 AND userid = $2",
      [id, userId]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Usage not found." })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error("Error during deletion:", error)
    res.status(500).json({ error: "Internal server error." })
  }
}

const getMonthlyTotalsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  try {
    const monthlyResult = await pool.query(
      `
      SELECT 
        to_char(date_trunc('month', day), 'YYYY') AS year,
        to_char(date_trunc('month', day), 'MM') AS month,
        COALESCE(SUM(total), 0)::NUMERIC AS total
      FROM usage
      GROUP BY date_trunc('month', day)
      ORDER BY year DESC, month DESC;
    `
    )

    const monthlyTotals = monthlyResult.rows.map((row: any) => ({
      year: row.year,
      month: row.month,
      total: row.total || 0,
      paid: false,
    }))

    res.json(monthlyTotals)
  } catch (error) {
    console.error("Error during monthly totals retrieval:", error)
    res.status(500).json({ error: "Internal server error." })
  }
}

// Definizione delle rotte con i rispettivi handler
usageRouter.post("/new", createUsageHandler) // Rotta per creare un nuovo record di utilizzo
usageRouter.post("/", getUsageHandler) // Rotta per ottenere i dati di utilizzo
usageRouter.put("/:id", updateUsageHandler) // Rotta per aggiornare un record di utilizzo
usageRouter.delete("/:id", deleteUsageHandler) // Rotta per eliminare un record di utilizzo
usageRouter.post("/monthly-totals", getMonthlyTotalsHandler) // Rotta per ottenere i totali mensili

export default usageRouter
