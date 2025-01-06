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
        model: "gpt-3.5-turbo", //   model: "gpt-4o-mini",
        temperature: 0.7,
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

export const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(";").shift()
}
