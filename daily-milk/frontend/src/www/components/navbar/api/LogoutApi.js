import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `https://poulin-bd075425a92c.herokuapp.com/auth/logout`

export const LogOut = async () => {
  const token = Cookies.get("token")
  try {
    // Sending a POST request to check expiration
    const response = await axios.post(API_URL, { token })
    return response
  } catch (error) {
    return false
  }
}
