import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

export const getPrompt = async (idPrompt, token) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.post(API_URL, { idPrompt }, { headers })
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
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.put(
      `${process.env.REACT_APP_API_URL}/prompt`,
      {
        content,
        model,
        temperature,
        idPrompt,
      },
      { headers }
    )

    return response.data
  } catch (error) {
    console.error("Errore durante il salvataggio del prompt:", error)
    throw error
  }
}
