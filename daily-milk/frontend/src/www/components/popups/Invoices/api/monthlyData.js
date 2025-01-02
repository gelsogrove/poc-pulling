// daily-milk/frontend/src/www/components/api/fetchUsage.js
import axios from "axios"
import Cookies from "js-cookie"

const monthyData = async () => {
  const token = Cookies.get("token")

  try {
    const response = await axios.post(
      `https://poulin-bd075425a92c.herokuapp.com/usage/monthly-totals`,
      { token } // Passa userId nel corpo della richiesta
    )
    return response.data // Restituisce l'array di dati
  } catch (error) {
    console.error("Errore durante il recupero dei dati:", error)
    return []
  }
}

export default monthyData
