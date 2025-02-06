import axios from "axios"
import Cookies from "js-cookie"

/**
 * Send a message to the chatbot API.
 *
 * @param {string} conversationId - Unique ID of the conversation.
 * @param {array} messages - Conversation history.
 * @param {string} idPrompt - Prompt ID for the chatbot.
 * @returns {Promise<object>} - API response containing the chatbot's response.
 */
export const sendMessageToChatbot = async (
  conversationId,
  messages,
  idPrompt,
  chatbotSelected
) => {
  const apiUrl = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/chatbot/response`

  const token = Cookies.get("token")
  const name = Cookies.get("name")

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const body = {
    name,
    conversationId,
    messages,
    idPrompt,
  }

  try {
    const response = await axios.post(apiUrl, body, { headers })
    return response.data // Restituisci direttamente i dati ricevuti dall'API
  } catch (error) {
    throw error // Propaga l'errore per essere gestito dal componente chiamante
  }
}
