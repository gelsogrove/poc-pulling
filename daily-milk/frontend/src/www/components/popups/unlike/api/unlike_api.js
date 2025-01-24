/* eslint-disable no-undef */
import axios from "axios"
import Cookies from "js-cookie"

export const fetchUnlikeData = async () => {
  const API_URL = `${process.env.REACT_APP_API_URL}/unlike`
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.get(API_URL, { headers })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error during initialize data fetch:", error)
    throw error
  }
}

export const deleteUnlikeRecord = async (id) => {
  try {
    // CHECK TOKE
    const token = Cookies.get("token")
    if (!token) {
      console.error("Token not found in cookies.")
      return null
    }

    // RUN QUERY
    const API_URL = `${process.env.REACT_APP_API_URL}/unlike`
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers,
    })

    return response.status === 204
  } catch (error) {
    console.error("Error deleting record:", error)
    throw error
  }
}
