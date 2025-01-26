// daily-milk/frontend/src/www/pages/api/RegisterApi.js
import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/auth/register`

export const register = async (userData) => {
  const response = await axios.post(API_URL, userData)
  return response.data
}
