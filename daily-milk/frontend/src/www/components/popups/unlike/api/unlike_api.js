import axios from "axios"
import Cookie from "js-cookie"

export const fetchUnlikeData = async () => {
  try {
    const token = Cookie.get("token")
    if (!token) {
      console.error("Token not found in cookies.")
      return null
    }

    const response = await axios.get(
      `https://poulin-bd075425a92c.herokuapp.com/unlike?token=${token}`
    )
    return response.data
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error
  }
}
