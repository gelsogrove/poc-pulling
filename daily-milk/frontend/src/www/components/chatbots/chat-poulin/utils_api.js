export const generateResponseWithContext = async (
  apiUrl,
  questionText,
  conversationHistory,
  systemPrompt,
  max_tokens,
  temperature,
  model
) => {
  try {
    const response = await fetch(apiUrl + "/poulin/resp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionText,
        conversationHistory,
        systemPrompt,
        max_tokens,
        temperature,
        model,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate response")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error generating response:", error)
    throw error
  }
}

export const initializeData = async (apiUrl, systemPrompt, filename, model) => {
  try {
    const response = await fetch(`${apiUrl}/poulin/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
        model,
        systemPrompt,
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
