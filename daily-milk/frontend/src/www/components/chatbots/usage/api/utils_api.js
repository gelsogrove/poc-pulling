import axios from "axios"

export const response = async (
  apiUrl,
  token,
  name,
  conversationId,
  messages
) => {
  try {
    if (!Array.isArray(messages)) {
      throw new Error("Messages must be an array")
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.post(
      `${apiUrl}/chatbot/response`,
      {
        name,
        conversationId,
        messages,
      },
      { headers }
    )

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error during initialize data fetch:", error)
    throw error
  }
}

export const getPromptDetails = async (idPrompt) => {
  const token = getCookie("token")

  const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  try {
    const params = {
      idPrompt,
      noprompt: true,
    }

    const response = await axios.get(API_URL, { headers, params })
    return response.data.content
  } catch (error) {
    console.error("Error during initialize data fetch:", error)
    throw error
  }
}

export const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(";").shift()
}

export const fetchUsageData = async () => {
  const token = getCookie("token")
  const API_URL = `${process.env.REACT_APP_API_URL}/usage`

  // Funzione per aggiungere un ritardo
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  try {
    // Attendi 1500 millisecondi prima di continuare
    await delay(1500)

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const data = await response.json()
    return data
  } catch (error) {
    return { error: "Request limit reached today. Try again tomorrow." }
  }
}
