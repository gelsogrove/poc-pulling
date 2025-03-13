import { API_URL } from "../../../config/constants"

const LOGIN_URL = `${API_URL}/auth/login`

export const login = async (username, password) => {
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
  return response.json()
}
