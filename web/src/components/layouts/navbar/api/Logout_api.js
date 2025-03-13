import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/auth/logout`

export const LogOut = async () => {
  const token = Cookies.get("token")

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  try {
    // Sending a POST request to check expiration
    const response = await axios.post(API_URL, {}, { headers })
    return response
  } catch (error) {
    return false
  }
}
