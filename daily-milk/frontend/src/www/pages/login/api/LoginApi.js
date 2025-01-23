import axios from "axios" // Importa axios per le chiamate API

const API_URL = `${process.env.REACT_APP_API_URL}/auth/login`

export const login = async (username, password) => {
  try {
    const response = await axios.post(API_URL, { username, password })
    return response.data
  } catch (error) {
    console.error("Error during login:", error)
    throw error
  }
}
