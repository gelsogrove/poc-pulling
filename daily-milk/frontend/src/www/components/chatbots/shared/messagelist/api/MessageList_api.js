import Cookies from "js-cookie"
const API_URL = process.env.REACT_APP_API_URL

export const handleUnlikeApi = async (
  msgId,
  conversationHistory,
  IdConversation,
  idPrompt,
  userId,
  model,
  temperature
) => {
  const payload = {
    conversationHistory: conversationHistory.slice(-3),
    conversationId: IdConversation,
    msgId,
    dataTime: getCurrentDateTime(),
    idPrompt,
    model,
    temperature,
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    }

    const response = await fetch(`${API_URL}/unlike/new`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("Failed to unlike the message:", response.statusText)
      return null
    }

    return response
  } catch (error) {
    console.error("Error in unliking message:", error)
    throw error
  }
}

export const getCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
