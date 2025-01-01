// daily-milk/frontend/src/www/pages/api/RegisterApi.js
import axios from "axios"

export const register = async (userData) => {
  const response = await axios.post("/api/auth/register", userData)
  return response.data
}
