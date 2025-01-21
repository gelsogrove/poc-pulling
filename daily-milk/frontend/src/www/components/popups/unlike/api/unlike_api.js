/* eslint-disable no-undef */
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
