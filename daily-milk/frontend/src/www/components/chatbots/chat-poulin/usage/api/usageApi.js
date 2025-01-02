export const fetchUsageData = async (userId) => {
  try {
    const response = await fetch(
      `https://poulin-bd075425a92c.herokuapp.com/usage?userId=${userId}`
    )
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching usage data:", error)
    return { error: "Request limit reached today. Try again tomorrow." }
  }
}
