import { v4 as uuidv4 } from "uuid"

/**
 * Returns the user's name from cookies, with a default value of "Guest" if not found.
 */
export const getUserName = () => {
  const name = "Guest" // Replace with cookie logic if necessary
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

/**
 * Updates both `messages` (UI) and `conversationHistory` (for the bot),
 * adding an array of updates in the format:
 * [ { sender, content, role }, ... ]
 */
export const updateChatState = (messages, conversationHistory, updates) => {
  const updatedMessages = [...messages]
  const updatedHistory = [...conversationHistory]

  updates.forEach(({ sender, content, role }) => {
    updatedMessages.push({
      id: uuidv4(),
      sender,
      text: content, // what the user sees in chat
    })
    updatedHistory.push({
      role,
      content, // what will be sent to the bot
    })
  })

  return { updatedMessages, updatedHistory }
}

/**
 * Parses a JSON object from the bot's message if it exists.
 * Ensures the JSON adheres to the expected structure with triggerAction, response, and sql.
 */
export const extractJsonFromMessage = (message) => {
  try {
    const match = message.match(/(\{[\s\S]*?\})/)
    if (!match) return message

    const parsed = JSON.parse(match[1])
    if (
      parsed &&
      typeof parsed === "object" &&
      "triggerAction" in parsed &&
      "response" in parsed &&
      "sql" in parsed
    ) {
      return parsed
    }
    return { response: "Invalid message format." }
  } catch {
    return { response: "Failed to parse message." }
  }
}

/**
 * Handles a global error, creating an "assistant" error message in both
 * `messages` and `conversationHistory`.
 */
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
