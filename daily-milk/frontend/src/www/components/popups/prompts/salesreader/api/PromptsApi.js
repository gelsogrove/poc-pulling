import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

export const getPrompt = async (idPrompt, token) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idPrompt, // Passa idPrompt come parametro nella query string
    }

    const response = await axios.get(API_URL, { headers, params })

    return response.data.content
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
