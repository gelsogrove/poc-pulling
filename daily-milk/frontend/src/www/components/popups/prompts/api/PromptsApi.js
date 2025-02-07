import axios from "axios"

export const getPrompt = async (idPrompt, token, chatbotSelected) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/prompt`

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
  promptname,
  token,
  chatbotSelected
) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.put(
      `${process.env.REACT_APP_API_URL}/${chatbotSelected}/prompt`,
      {
        content,
        model,
        temperature,
        idPrompt,
        promptname,
      },
      { headers }
    )

    return response.data
  } catch (error) {
    console.error("Errore durante il salvataggio del prompt:", error)
    throw error
  }
}

export const getModels = async (token) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/models`
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to fetch models")
  }
  return await response.json()
}
