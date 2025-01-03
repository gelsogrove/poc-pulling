import axios from "axios"

const API_URL = "https://poulin-bd075425a92c.herokuapp.com/prompt"

export const getPrompt = async () => {
  try {
    const response = await axios.get(API_URL)
    return response.data
  } catch (error) {
    console.error("Errore durante il recupero del prompt:", error)
    throw error
  }
}

export const postPrompt = async (content) => {
  try {
    const response = await axios.post(API_URL, { content })
    return response.data
  } catch (error) {
    console.error("Errore durante il salvataggio del prompt:", error)
    throw error
  }
}
