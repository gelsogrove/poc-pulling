import axios from "axios"
import dotenv from "dotenv"
import { pool } from "../../../server.js"

dotenv.config()

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

export const cleanResponse = (responseText: string) => {
  return responseText
    .replace(/^```json\s*/i, "")
    .replace(/```$/, "")
    .trim()
}

export const handleError = (error: unknown): { message: string } => {
  if (axios.isAxiosError(error)) {
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
        error.response.statusText
      return { message: errorMessage }
    }
  }
  return { message: "An unexpected error occurred." }
}

export const sendUsageData = async (
  userId: string,
  idPrompt: string,
  chatbotSelected: string
) => {
  try {
    const today = new Date().toISOString().split("T")[0]
    const result = await pool.query(
      "INSERT INTO usage (day, total, service, idprompt, userid) VALUES ($1, 1, $2, $3, $4) ON CONFLICT (day, service, idprompt, userid) DO UPDATE SET total = usage.total + 1 RETURNING total",
      [today, chatbotSelected, idPrompt, userId]
    )
    return result.rows[0].total
  } catch (error) {
    console.error("Error updating usage:", error)
    throw error
  }
}

export const executeSqlQuery = async (sqlQuery: string) => {
  try {
    const result = await pool.query(sqlQuery)
    return result.rows
  } catch (error) {
    console.error("Error executing SQL query:", error)
    throw error
  }
}

export const generateDetailedSentence = async (
  model: string,
  sqlData: any[],
  temperature: number,
  OPENROUTER_API_URL: string,
  OPENROUTER_HEADERS: any,
  userMessage: string
) => {
  try {
    const requestPayload = {
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "user", content: userMessage },
        { role: "system", content: `Result: ${JSON.stringify(sqlData)}` },
        {
          role: "user",
          content:
            "Please summarize the result of the query repeating the question so it's more clear in one sentence using the <b> for important values if we are showing the moeny don't forget to put the $ char , AGGIUNGO ANCHE CHE I NUMERI DEVONO AVERE LE MIGLIAIA ES 2.676, please round if the numer is $674,342.60. show only $674,342",
        },
      ],
      max_tokens: 1000,
      temperature: Number(temperature),
    }

    const openaiResponse = await axios.post(
      OPENROUTER_API_URL,
      requestPayload,
      {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
      }
    )

    const rawResponse = cleanResponse(
      openaiResponse.data.choices[0]?.message?.content
    )

    if (!rawResponse) {
      console.error("Second pass: Empty response from OpenRouter.")
      return "Failed to generate a detailed sentence for the result."
    }

    return rawResponse
  } catch (error) {
    console.error("Error in generateDetailedSentence:", error)
    return "An error occurred while creating a detailed sentence for the result."
  }
}
