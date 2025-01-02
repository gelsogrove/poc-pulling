import axios from "axios"
import Cookies from "js-cookie"

const API_URL = (userId) =>
  `https://poulin-bd075425a92c.herokuapp.com/auth/is-expired`

export const isExpired = async () => {
  const userId = Cookies.get("userId")
  try {
    // Sending a POST request to check expiration
    const response = await axios.post(API_URL(userId), { userId })
    return response.data.isExpired
  } catch (error) {
    console.error("Error checking expiration:", error)
    return false
  }
}
