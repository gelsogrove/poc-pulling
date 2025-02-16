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

  console.log("Sending data:", promptData) // Debug log

  formData.append("promptname", promptData.promptname)
  formData.append("model", promptData.model)
  formData.append("temperature", promptData.temperature)
  formData.append("content", promptData.content) // Qui era il problema: usiamo content invece di prompt
  formData.append("path", promptData.path)

  // Se l'immagine è in base64, la convertiamo in blob
  if (promptData.image && promptData.image.startsWith("data:image")) {
    const response = await fetch(promptData.image)
    const blob = await response.blob()
    formData.append("image", blob, "image.jpg")
  } else if (promptData.image !== "/images/chatbot.webp") {
    formData.append("image", promptData.image)
  }

  // Debug log per vedere cosa stiamo inviando
  for (let pair of formData.entries()) {
    console.log(pair[0] + ": " + pair[1])
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
