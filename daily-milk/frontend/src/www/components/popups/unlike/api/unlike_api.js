/* eslint-disable no-undef */
import axios from "axios"
import Cookies from "js-cookie"

export const fetchUnlikeData = async () => {
  const token = Cookies.get("token")
  try {
    const response = await fetch(
      `https://poulin-bd075425a92c.herokuapp.com/unlike`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      }
    )

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
    const token = Cookies.get("token")
    if (!token) {
      console.error("Token not found in cookies.")
      return null
    }

    const response = await axios.delete(
      `https://poulin-bd075425a92c.herokuapp.com/unlike/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { token },
      }
    )

    return response.status === 204
  } catch (error) {
    console.error("Error deleting record:", error)
    throw error
  }
}
