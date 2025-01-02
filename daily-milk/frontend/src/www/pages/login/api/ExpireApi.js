import axios from "axios"

const API_URL = () => `https://poulin-bd075425a92c.herokuapp.com/auth/expire/`

export const getExpire = async (userId) => {
  try {
    const response = await axios.post(API_URL(), {
      userId,
    })
    return response.data
  } catch (error) {
    console.error("Error fetching expire:", error)
    throw error
  }
}

export const setExpire = async (userId, timestamp) => {
  try {
    const response = await axios.put(API_URL(), {
      userId,
      expireDate: timestamp,
    })
    return response.data
  } catch (error) {
    console.error("Error setting expire:", error)
    throw error
  }
}
