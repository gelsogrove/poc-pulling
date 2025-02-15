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

const updatePrompt = async (id, promptData) => {
  const token = Cookies.get("token")

  const formData = new FormData()
  formData.append("promptname", promptData.promptname)
  formData.append("model", promptData.model)
  formData.append("temperature", promptData.temperature)
  formData.append("prompt", promptData.content)
  formData.append("path", promptData.path)

  // Se l'immagine è in base64, la convertiamo in blob
  if (promptData.image && promptData.image.startsWith("data:image")) {
    const response = await fetch(promptData.image)
    const blob = await response.blob()
    formData.append("image", blob, "image.jpg")
  } else if (promptData.image !== "/images/chatbot.webp") {
    formData.append("image", promptData.image)
  }

  const response = await axios.put(`${API_URL}/update/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  })

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
