import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

/**
 * Saves a message and its response to the conversation history
 */
export const saveMessageHistory = async (
  userId: string,
  userMessage: string,
  botResponse: string
): Promise<void> => {
  try {
    await pool.query(
      "INSERT INTO conversation_history (iduser, message, response, created_at) VALUES ($1, $2, $3, NOW())",
      [userId, userMessage, botResponse]
    )
  } catch (error) {
    console.error("Error saving message history:", error)
    throw error
  }
}

/**
 * Retrieves conversation history for a user
 */
export const getMessageHistory = async (
  userId: string,
  limit: number = 10
): Promise<Array<{ role: string; content: string }>> => {
  try {
    const result = await pool.query(
      "SELECT message, response FROM conversation_history WHERE iduser = $1 ORDER BY created_at DESC LIMIT $2",
      [userId, limit]
    )

    return result.rows.flatMap((row) => [
      { role: "user", content: row.message },
      { role: "assistant", content: row.response },
    ])
  } catch (error) {
    console.error("Error retrieving message history:", error)
    throw error
  }
}
