import { Request, Response, Router } from "express"
import { pool } from "../../../server.js"
import { validateRequest } from "../share/validateUser.js"

const monthlyUsageRouter = Router()

const getMonthlyTotalsHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, token } = await validateRequest(req, res)
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
monthlyUsageRouter.post("/monthly-totals", getMonthlyTotalsHandler)

export default monthlyUsageRouter
