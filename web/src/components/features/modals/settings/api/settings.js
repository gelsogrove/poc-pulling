export const updateFacebookToken = async (token) => {
  try {
    const response = await axios.put("/api/settings/facebook-token", { token })
    return response.data
  } catch (error) {
    console.error("Error updating Facebook token:", error)
    throw error
  }
}
