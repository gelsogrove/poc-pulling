import { pool } from "../server.js" // Assicurati che il percorso sia corretto

export const getPrompt = async (idPrompt: string): Promise<any | null> => {
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

export const detectLanguage = async (text: string): Promise<string> => {
  const detectionPrompt = `Identify the language of the following text and return the ISO 639-1 code:\n"${text}"`
  const model = "gpt-4" // Usa il modello appropriato per il rilevamento della lingua
  const temperature = 0.0

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: detectionPrompt }],
          max_tokens: 10,
          temperature,
        }),
      }
    )

    const data = await response.json()
    return data.choices[0]?.message?.content.trim() || "en" // Default to English
  } catch (error) {
    console.error("Error detecting language:", error)
    return "en" // Default to English
  }
}

export const getUserIdByToken = async (
  token: string
): Promise<string | null> => {
  try {
    const result = await pool.query(
      "SELECT user_id FROM tokens WHERE token = $1",
      [token]
    )
    return result.rows.length > 0 ? result.rows[0].user_id : null
  } catch (error) {
    console.error("Error validating token:", error)
    return null
  }
}
