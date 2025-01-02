import { getCookie } from "./utils_api"

export const fetchUsageData = async () => {
  const token = getCookie("token")
  try {
    const response = await fetch(
      `https://poulin-bd075425a92c.herokuapp.com/usage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      }
    )
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const data = await response.json()
    return data
  } catch (error) {
    return { error: "Request limit reached today. Try again tomorrow." }
  }
}
