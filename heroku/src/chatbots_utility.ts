import axios from "axios"
import dotenv from "dotenv"
import { pool } from "../server.js"

dotenv.config()

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

/**
 * Validates the user's token.
 */
export const validateToken = async (token: string) => {
  try {
    const result = await pool.query(
      "SELECT user_id FROM users WHERE token = $1",
      [token]
    )
    return result.rows.length > 0 ? result.rows[0].user_id : null
  } catch (error) {
    console.error("Error validating token:", error)
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

/**
 * Detects the language of a given message using the configured model.
 */
export const detectLanguage = async (message: string) => {
  const detectionPrompt = `
Identify the language of the following text and return the ISO 639-1 code:
"${message}"
  `.trim()

  try {
    const promptConfig = await getPrompt("a2c502db-9425-4c66-9d92-acd3521b38b5")
    const model = promptConfig?.model || "gpt-4" // Default to gpt-4 if not found

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages: [{ role: "system", content: detectionPrompt }],
        max_tokens: 10,
        temperature: 0.0,
      },
      { headers: OPENROUTER_HEADERS, timeout: 10000 }
    )

    const detectedLanguage = response.data.choices[0]?.message?.content.trim()
    return detectedLanguage || "en" // Default to English if detection fails
  } catch (error) {
    console.error("Language detection failed:", error)
    return "en" // Default to English in case of error
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
