import axios from "axios"
import dotenv from "dotenv"
import { pool } from "../server.js"
import { getUserIdByToken } from "./validateUser.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

export const validateToken = async (token: string) => {
  try {
    const userId = await getUserIdByToken(token)
    if (!userId) {
      return null
    }
    return userId
  } catch (error) {
    return null
  }
}
/**
 * Fetches the prompt along with its model and temperature from the database.
 */
export const getPrompt = async (idPrompt: string) => {
  try {
    const result = await pool.query(
      "SELECT prompt, model, temperature FROM prompts WHERE idPrompt = $1",
      [idPrompt]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error("Error fetching prompt:", error)
    return null
  }
}

export const handleError = (error: unknown): { message: string } => {
  if (axios.isAxiosError(error)) {
    // Qui sappiamo che error è un AxiosError, quindi ha proprietà come code, response, etc.
    console.error("Axios Error:", {
      message: error.message,
      code: error.code,
      response: error.response?.data || null,
      stack: error.stack,
    })

    if (error.code === "ECONNABORTED") {
      return { message: "Timeout, please try again later." }
    } else if (error.response) {
      const errorMessage =
        (error.response.data as { message?: string })?.message ||
        "OpenRouter error."
      return { message: errorMessage }
    } else {
      return {
        message:
          "An unexpected error occurred. Please contact support if the issue persists.",
      }
    }
  } else if (error instanceof Error) {
    // Gestione per errori generici non Axios
    console.error("Generic Error:", {
      message: error.message,
      stack: error.stack,
    })
    return { message: error.message }
  } else {
    console.error("Unexpected error type:", error)
    return {
      message: "Unknown error. Please contact support if the problem persists.",
    }
  }
}
/**
 * Executes a query via the SQL API and returns the results.
 */
export const executeSqlQuery = async (sqlQuery: string) => {
  try {
    const sqlApiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(
      sqlQuery
    )}`
    const sqlResult = await axios.get(sqlApiUrl)
    return sqlResult.data
  } catch (error) {
    console.error("Error executing SQL query:", error)
    throw new Error("SQL execution failed")
  }
}
