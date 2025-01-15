// Function to extract JSON from a backend response message
export const extractJsonFromMessage = (message) => {
  try {
    if (typeof message === "string") {
      const parsed = JSON.parse(message) // Parse the string into JSON
      return parsed
    }
    return message // If already an object, return it directly
  } catch (error) {
    console.error("Error parsing message:", error)
    return { response: "Error parsing response from backend." }
  }
}

// Function to update chat state with new messages
export const updateChatState = (messages, history, newMessages) => {
  const updatedMessages = [
    ...messages,
    ...newMessages.map((msg) => ({
      id: msg.id || `${Date.now()}-${Math.random()}`, // Generate unique ID if missing
      sender: msg.role === "user" ? "user" : "bot",
      text: msg.content,
      data: msg.data || null, // Attach data if it exists
    })),
  ]

  const updatedHistory = [
    ...history,
    ...newMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ]

  return { updatedMessages, updatedHistory }
}

// Function to handle errors and append a generic error message
export const handleError = (error, messages, history) => {
  console.error("Error:", error)
  const errorMessage = {
    id: `${Date.now()}-error`,
    sender: "bot",
    text: "An error occurred. Please try again later.",
  }

  const updatedMessages = [...messages, errorMessage]
  const updatedHistory = [...history]

  return { updatedMessages, updatedHistory }
}

// Function to get user name from localStorage or fallback to default
export const getUserName = () => {
  const defaultName = "Guest"
  const userName = localStorage.getItem("userName") || defaultName
  return userName
}
