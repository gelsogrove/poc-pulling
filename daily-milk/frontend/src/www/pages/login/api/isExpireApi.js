import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/auth/is-expired`

export const IsExpired = async () => {
  const token = Cookies.get("token")
  try {
    // Sending a POST request to check expiration
    const response = await axios.post(API_URL, { token })
    return response.data.isExpired
  } catch (error) {
    console.error("Error checking expiration:", error)
    return false
  }
}
