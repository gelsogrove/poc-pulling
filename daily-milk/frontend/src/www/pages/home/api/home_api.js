import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

export const getPromptName = async (idPrompt, token) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idPrompt,
      noprompt: true, // Usiamo noprompt per ottenere solo i metadati senza il contenuto del prompt
    }

    const response = await axios.get(API_URL, { headers, params })
    return response.data.content.promptname
  } catch (error) {
    console.error("Errore durante il recupero del nome del prompt:", error)
    throw error
  }
}
