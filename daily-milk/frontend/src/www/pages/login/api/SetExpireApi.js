import axios from "axios"

const API_URL = () =>
  `https://poulin-bd075425a92c.herokuapp.com/auth/set-expire/`

export const setExpire = async (userId) => {
  try {
    const response = await axios.put(API_URL(), {
      userId,
    })
    return response.data
  } catch (error) {
    console.error("Error setting expire:", error)
    throw error
  }
}
