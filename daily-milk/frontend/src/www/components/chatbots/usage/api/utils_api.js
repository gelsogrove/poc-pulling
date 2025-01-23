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

    const response = await fetch(`${apiUrl}/chatbot/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        name,
        conversationId,
        messages,
        // model: "google/gemini-2.0-flash-exp:free",
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error during initialize data fetch:", error)
    throw error
  }
}

export const getPromptDetails = async () => {
  const token = getCookie("token")

  const API_URL = `${process.env.REACT_APP_API_URL}/prompt`

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data.content
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

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
