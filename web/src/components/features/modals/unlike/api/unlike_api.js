/* eslint-disable no-undef */
import axios from "axios"
import Cookies from "js-cookie"

export const fetchUnlikeData = async (idPrompt, chatbotSelected) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/unlike`
  const token = Cookies.get("token")

  try {
    // Configura gli headers e i parametri della richiesta
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idPrompt, // Passa idPrompt come parametro nella query string
    }

    // Effettua la richiesta GET con axios
    const response = await axios.get(API_URL, { headers, params })

    // axios converte automaticamente la risposta in JSON
    return response.data
  } catch (error) {
    console.error("Error fetching unlike data:", error)
    throw error // Rilancia l'errore per una gestione successiva
  }
}

export const deleteUnlikeRecord = async (id, chatbotSelected) => {
  try {
    // CHECK TOKE
    const token = Cookies.get("token")
    if (!token) {
      console.error("Token not found in cookies.")
      return null
    }

    // RUN QUERY
    const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/unlike`
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers,
    })

    return response.status === 204
  } catch (error) {
    console.error("Error deleting record:", error)
    throw error
  }
}

export const fetchUserName = async (userid) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/auth/getclient`
  const token = Cookies.get("token")
  try {
    // Configura gli headers e i parametri della richiesta
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      userid, // Passa userID come parametro
    }

    // Effettua la richiesta GET con axios
    const response = await axios.get(API_URL, { headers, params })

    // axios converte automaticamente la risposta in JSON
    // Restituisci l'oggetto `row` completo
    return response.data.row
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error // Rilancia l'errore per una gestione successiva
  }
}
