// daily-milk/frontend/src/www/pages/api/RegisterApi.js
import axios from "axios"

const API_URL = "https://poulin-bd075425a92c.herokuapp.com/auth/register"

export const register = async (userData) => {
  const response = await axios.post(API_URL, userData)
  return response.data
}
