import axios from "axios"

const API_URL = (userId) =>
  `https://poulin-bd075425a92c.herokuapp.com/auth/expire/${userId}`

export const getExpire = async (userId) => {
  try {
    const response = await axios.get(API_URL(userId))
    return response.data
  } catch (error) {
    console.error("Error fetching expire:", error)
    throw error
  }
}

export const setExpire = async (userId, timestamp) => {
  try {
    const response = await axios.post(API_URL(userId), timestamp)
    return response.data
  } catch (error) {
    console.error("Error setting expire:", error)
    throw error
  }
}
