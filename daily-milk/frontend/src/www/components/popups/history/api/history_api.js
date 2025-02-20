import axios from "axios"
import Cookies from "js-cookie"

export const GetHistoryChats = async (idPrompt, chatbotSelected) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/history/chats`
  const token = Cookies.get("token")

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const params = {
      idPrompt,
    }

    const response = await axios.get(API_URL, { headers, params })
    console.log("Response data:", response.data)

    return response.data
  } catch (error) {
    console.error("Error fetching history chats:", error)
    throw error
  }
}

export const DeleteHistory = async (idHistory, chatbotSelected) => {
  const API_URL = `${process.env.REACT_APP_API_URL}/${chatbotSelected}/history/delete`
  const token = Cookies.get("token")

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.delete(`${API_URL}/${idHistory}`, { headers })

    if (response.status === 204) {
      console.log("History successfully deleted.")
      return true
    } else {
      console.warn("Unexpected response status:", response.status)
      return false
    }
  } catch (error) {
    console.error(
      "Error deleting history:",
      error.response ? error.response.data : error.message
    )
    throw error
  }
}

function populateChatList(chatData) {
  const chatList = document.getElementById("chatList")
  chatList.innerHTML = "" // Clear existing list

  if (chatData && chatData.length > 0) {
    chatData.forEach((chat) => {
      const listItem = document.createElement("li")
      // Use the date from the 'datetime' property and format it
      const date = new Date(chat.datetime).toLocaleString()
      listItem.textContent = `Data: ${date}`
      listItem.onclick = () => showChatHistory(chat) // Call showChatHistory on click
      chatList.appendChild(listItem)
    })
  } else {
    console.log("No chat data to display")
  }
}

function showChatHistory(chat) {
  const chatHistory = document.getElementById("chatHistory")
  const history = JSON.parse(chat.history)
  chatHistory.innerHTML = history
    .map((entry) => `<p><strong>${entry.role}:</strong> ${entry.content}</p>`)
    .join("")
  chatHistory.style.display = "block"
}

// Assicurati di definire idPrompt e chatbotSelected
const idPrompt = "yourPromptId" // Sostituisci con l'ID del prompt corretto
const chatbotSelected = "yourChatbot" // Sostituisci con il chatbot selezionato

GetHistoryChats(idPrompt, chatbotSelected)
  .then((chatData) => {
    populateChatList(chatData)
  })
  .catch((error) => {
    console.error("Error fetching chat data:", error)
  })
