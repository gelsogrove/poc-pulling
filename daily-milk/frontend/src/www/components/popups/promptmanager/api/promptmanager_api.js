import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/prompts`

const getPrompts = async () => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.get(API_URL, { headers })
  return response.data
}

const createPrompt = async (promptData) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.post(`${API_URL}/new`, promptData, { headers })
  return response.data
}

const updatePrompt = async (idPrompt, promptData) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.put(
    `${API_URL}/update/${idPrompt}`,
    promptData,
    { headers }
  )
  return response.data
}

const deletePrompt = async (idPrompt) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.delete(`${API_URL}/delete/${idPrompt}`, {
    headers,
  })
  return response.data
}

const getModels = async () => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.get(`${process.env.REACT_APP_API_URL}/models`, {
    headers,
  })
  return response.data
}

const togglePromptActive = async (idPrompt) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.put(
    `${API_URL}/toggle/${idPrompt}`,
    {},
    { headers }
  )
  return response.data
}

const togglePromptHide = async (idPrompt) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.put(
    `${API_URL}/toggle-hide/${idPrompt}`,
    {},
    { headers }
  )
  return response.data
}

const movePromptOrder = async (idPrompt, direction) => {
  const token = Cookies.get("token")
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const response = await axios.put(
    `${API_URL}/move-order/${idPrompt}/${direction}`,
    {},
    { headers }
  )
  return response.data
}

export {
  createPrompt,
  deletePrompt,
  getModels,
  getPrompts,
  movePromptOrder,
  togglePromptActive,
  togglePromptHide,
  updatePrompt,
}
