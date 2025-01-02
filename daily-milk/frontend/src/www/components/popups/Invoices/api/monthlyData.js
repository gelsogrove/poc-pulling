// daily-milk/frontend/src/www/components/api/fetchUsage.js
import axios from "axios"

const monthyData = async () => {
  // Recupera l'userId dai cookie
  const userId = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userId="))
    .split("=")[1]

  try {
    const response = await axios.post(
      `https://poulin-bd075425a92c.herokuapp.com/usage/monthly-totals`,
      { userId } // Passa userId nel corpo della richiesta
    )
    return response.data // Restituisce l'array di dati
  } catch (error) {
    console.error("Errore durante il recupero dei dati:", error)
    return []
  }
}

export default monthyData
