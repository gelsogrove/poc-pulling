import axios from "axios"

export const getPromptName = async (idPrompt, token, chatbotSelected) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/prompt`

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idPrompt,
    }
    console.log("***********", idPrompt)

    const response = await axios.get(API_URL, { headers, params })
    return response.data.content.promptname
  } catch (error) {
    console.error("Errore durante il recupero del nome del prompt:", error)
    throw error
  }
}

export const checkUnlikeExists = async (idPrompt, token, chatbotSelected) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idPrompt,
    }

    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/${chatbotSelected}/unlike/check`,
      {
        headers,
        params,
      }
    )
    return response.data.exists
  } catch (error) {
    console.error("Errore durante la verifica degli unlike:", error)
    return false
  }
}
