import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

export const getPrompt = async (token) => {
  try {
    const response = await axios.post(API_URL, { token })
    console.log("Prompt fetched:", response.data.content)
    return response.data.content // Restituisce introduction, model, e temperature
  } catch (error) {
    console.error("Errore durante il recupero del prompt:", error)
    throw error
  }
}

export const postPrompt = async (
  content,
  model,
  temperature,
  idPrompt,
  token
) => {
  try {
    const response = await axios.put(
      `${process.env.REACT_APP_API_URL}/prompt`,
      {
        content,
        model,
        temperature,
        idPrompt,
        token,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    )
    console.log("Response:", response.data)
    return response.data
  } catch (error) {
    console.error("Errore durante il salvataggio del prompt:", error)
    throw error
  }
}
