import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/roles`

const createRole = async (role) => {
  if (!role) {
    throw new Error("Il campo 'role' non può essere nullo.")
  }

  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.post(API_URL + "/new", { role }, { headers })
  return response.data
}

const getRoles = async () => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.get(API_URL, { headers })
  return response.data
}

const updateRole = async (idrole, role) => {
  if (!role) {
    throw new Error("Il campo 'role' non può essere nullo.")
  }

  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.put(
    `${API_URL}/update/${idrole}`,
    { role },
    { headers }
  )
  return response.data
}

const deleteRole = async (role) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.delete(`${API_URL}/delete/${role.idrole}`, {
    headers,
  })
  return response.data
}

export { createRole, deleteRole, getRoles, updateRole }
