import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

export const getPrompt = async (token) => {
  try {
    const response = await axios.post(API_URL, { token })
    console.log(response.data.content)
    return response.data.content
  } catch (error) {
    console.error("Errore durante il recupero del prompt:", error)
    throw error
  }
}

export const postPrompt = async (content, token) => {
  try {
    const response = await axios.put(
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
