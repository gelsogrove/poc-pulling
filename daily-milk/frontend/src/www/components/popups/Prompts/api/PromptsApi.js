import axios from "axios"

const API_URL = "https://poulin-bd075425a92c.herokuapp.com/prompt"

export const getPrompt = async (token) => {
  try {
    const response = await axios.put(API_URL, { token })
    return response.data
  } catch (error) {
    console.error("Errore durante il recupero del prompt:", error)
    throw error
  }
}

export const postPrompt = async (content, token) => {
  console.log("Content:", content)
  console.log("Token:", token)
  try {
    const response = await axios.post(
      API_URL,
      { content, token },
      { headers: { "Content-Type": "application/json" } }
    )
    console.log("Response:", response.data)
    return response.data
  } catch (error) {
    console.error("Errore durante il salvataggio del prompt:", error)
    throw error
  }
}
