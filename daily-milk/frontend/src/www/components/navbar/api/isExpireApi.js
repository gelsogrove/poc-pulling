import axios from "axios"
import Cookies from "js-cookie"

const API_URL = (userId) =>
  `https://poulin-bd075425a92c.herokuapp.com/auth/is-expired/${userId}`

export const isExpired = async () => {
  const userId = Cookies.get("userId")
  try {
    const response = await axios.get(API_URL(userId))
    return response.data.isExpired
  } catch (error) {
    console.error("Error checking expiration:", error)
    return false
  }
}
