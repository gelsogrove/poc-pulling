export const response = async (apiUrl, token, conversationId) => {
  try {
    const response = await fetch(`${apiUrl}/chatbot/response`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        conversationId,
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
