// Function to add a loading message from the bot
export const addBotLoadingMessage = (setMessages) => {
  setMessages((prevMessages) => [
    ...prevMessages,
    { id: crypto.randomUUID(), sender: "bot", text: "..." }, // Placeholder for loading message
  ])
}

// Function to replace the bot's last message with an error message
export const replaceBotMessageWithError = (setMessages, errorMessage) => {
  setMessages((prevMessages) =>
    prevMessages.slice(0, -1).concat({
      id: crypto.randomUUID(),
      sender: "bot",
      text: errorMessage,
    })
  )
}

// Function to load embedding data from a given URL
export const loadEmbeddingData = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to load embedding data")
    return await response.json()
  } catch (error) {
    console.error("Embedding loading error:", error)
    return null
  }
}

export const formatText = (data) => {
  if (typeof data === "string") {
    const jsonStringMatch = data.match(/{.*}/s) // Matches the first JSON object found in the string

    if (jsonStringMatch) {
      const jsonString = jsonStringMatch[0] // Extracted JSON string
      try {
        const jsonData = JSON.parse(jsonString) // Parse the extracted JSON string
        return jsonData // Update this function to return page too
      } catch (error) {
        console.error("Error parsing input string:", error)
        return { formattedResponse: data, options: [], page: null } // Restituisci la stringa originale in caso di errore
      }
    } else {
      return { formattedResponse: data }
    }
  }
}

// Update the extractResponseData function to return the page number

export const cleanText = (text) => {
  return text
    .replace(/\\n/g, " ") // Sostituisce \n con uno spazio
    .replace(/\\r/g, "") // Rimuove \r se presente
    .replace(/\s+/g, " ") // Riduce spazi bianchi multipli a uno
    .trim() // Rimuove spazi all'inizio e alla fine
}

export const formatBoldText = (text) => {
  // Rimuovi i blocchi di codice HTML e altri delimitatori
  text = text.replace(/```html|html```|```/g, "") // Rimuove tutti i delimitatori di codice

  text = text.replace(/\n/g, "<br>")

  // Sostituisci **testo** con <b>testo</b>
  return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
}

export function getCookie(name) {
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}
