import axios from "axios"
import Cookies from "js-cookie"

export const GetHistoryChats = async (idConversation, idPrompt, idUser) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/conversation_history/get`
  const token = Cookies.get("token")

  try {
    // Configura gli headers e i parametri della richiesta
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idConversation,
      idPrompt,
      idUser,
    }

    // Effettua la richiesta GET con axios
    const response = await axios.get(API_URL, { headers, params })

    // axios converte automaticamente la risposta in JSON
    return response.data.history
  } catch (error) {
    console.error("Error fetching history chats:", error)
    throw error
  }
}

export const DeleteHistory = async (idHistory) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/conversation_history/delete`
  const token = Cookies.get("token")

  try {
    // Configura gli headers della richiesta
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    // Effettua la richiesta DELETE con axios
    const response = await axios.delete(`${API_URL}/${idHistory}`, { headers })

    return response.status === 204
  } catch (error) {
    console.error("Error deleting history:", error)
    throw error
  }
}
