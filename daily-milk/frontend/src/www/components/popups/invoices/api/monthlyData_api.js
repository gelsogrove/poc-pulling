// daily-milk/frontend/src/www/components/api/fetchUsage.js
import axios from "axios"
import Cookies from "js-cookie"

const monthyData = async (chatbotSelected = "poulin/sales-reader") => {
  const token = Cookies.get("token")

  const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/usage/monthly-totals`

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  try {
    const response = await axios.post(API_URL, {}, { headers })
    return response.data
  } catch (error) {
    console.error("Errore durante il recupero dei dati:", error)
    return []
  }
}

export default monthyData
