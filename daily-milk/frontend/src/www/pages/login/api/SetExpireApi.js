import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/auth/set-expire`

export const setExpire = async (userId) => {
  try {
    const response = await axios.put(API_URL, {
      userId,
    })
    return response.data
  } catch (error) {
    console.error("Error setting expire:", error)
    throw error
  }
}
