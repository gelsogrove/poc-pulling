import axios from "axios"
import Cookies from "js-cookie"

export const API_URL = `${process.env.REACT_APP_API_URL}/auth/is-expired`

export const IsExpired = async () => {
  const token = Cookies.get("token") // Ottieni il token dai cookie

  const API_URL = `${process.env.REACT_APP_API_URL}/auth/is-expired`
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    // Invia una richiesta POST con gli header corretti
    const response = await axios.post(
      API_URL,
      {}, // Il corpo della richiesta è vuoto
      { headers } // Gli header devono essere passati qui
    )

    return response.data.isExpired // Restituisce lo stato di scadenza
  } catch (error) {
    console.error("Error checking expiration:", error)
    return false // In caso di errore, restituisce false
  }
}
