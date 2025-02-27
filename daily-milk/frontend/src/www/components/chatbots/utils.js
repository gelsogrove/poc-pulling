import Cookies from "js-cookie"
import { v4 as uuidv4 } from "uuid"

/**
 * Returns the user's name from cookies, with a default value of "Guest" if not found.
 */
export const getUserName = () => {
  const name = Cookies.get("name") // Replace with cookie logic if necessary
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

export const updateChatState = (messages, updates) => {
  const updatedMessages = [...messages]

  updates.forEach(({ sender, content, role }) => {
    updatedMessages.push({
      id: uuidv4(),
      text: content, // what the user sees in chat
    })
  })

  return { updatedMessages }
}

// Function to extract JSON from a backend response message
export const extractJsonFromMessage = (message) => {
  try {
    if (typeof message === "string") {
      const parsed = JSON.parse(message) // Parse the string into JSON
      return parsed
    }
    return message // If already an object, return it directly
  } catch (err) {
    return message
  }
}

export const handleError = (error, messages, conversationHistory) => {
  const errorMsg = error.message || "An error occurred."
  const updatedMessages = [
    ...messages,
    { id: uuidv4(), sender: "bot", text: errorMsg },
  ]
  const updatedHistory = [
    ...conversationHistory,
    { role: "assistant", content: errorMsg },
  ]

  return { updatedMessages, updatedHistory }
}

export const sanitizedHistory = (updatedHistory) =>
  updatedHistory.map((message) => {
    const { data, ...rest } = message // Rimuove il campo "data"
    return rest
  })
