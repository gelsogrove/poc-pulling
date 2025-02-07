import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/models`

const createModel = async (model) => {
  if (!model) {
    throw new Error("Il campo 'model' non può essere nullo.")
  }

  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.post(API_URL, { model }, { headers })
  return response.data
}

const getModels = async () => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.get(API_URL, { headers })
  return response.data
}

const updateModel = async (idmodel, model) => {
  if (!model) {
    throw new Error("Il campo 'model' non può essere nullo.")
  }

  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.put(
    `${API_URL}/${idmodel}`,
    { model },
    { headers }
  )
  return response.data
}

const deleteModel = async (idmodel) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.delete(`${API_URL}/delete/${idmodel}`, {
    headers,
  })
  return response.data
}

export { createModel, deleteModel, getModels, updateModel }
