export const fetchUsageData = async () => {
  try {
    const response = await fetch(
      "https://poulin-bd075425a92c.herokuapp.com/usage"
    )
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching usage data:", error)
    return null
  }
}
