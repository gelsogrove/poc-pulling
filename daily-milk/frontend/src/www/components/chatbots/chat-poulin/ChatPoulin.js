// ChatPoulin.js - Migliorato per mostrare statistiche iniziali e parsing lingua
import axios from "axios"
import Cookies from "js-cookie"
import React, { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import ChatInput from "../shared/chatinput/ChatInput"
import MessageList from "../shared/messagelist/MessageList"
import "./ChatPoulin.css"

import { extractJsonFromMessage, getUserName, updateChatState } from "./utils"

const ChatPoulin = ({ openPanel }) => {
  const [messages, setMessages] = useState([])
  const [conversationHistory, setConversationHistory] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)

  const messagesEndRef = useRef(null)
  const apiUrl = "https://poulin-bd075425a92c.herokuapp.com/chatbot/response"
  const statsUrl = "https://ai.dairy-tools.com/api/stats.php?type=csv"
  const IdConversation = uuidv4()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const userName = getUserName()
    const { updatedMessages, updatedHistory } = updateChatState(
      [],
      [],
      [
        {
          sender: "bot",
          content: `Hello, ${userName}! How can I assist you today?`,
          role: "assistant",
        },
      ]
    )
    setMessages(updatedMessages)
    setConversationHistory(updatedHistory)

    // Fetch initial statistics
    const fetchStatistics = async () => {
      try {
        const response = await axios.get(statsUrl)
        setStatistics(response.data)

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: uuidv4(),
            sender: "bot",
            text: "Here are some initial statistics to get started:",
            data: response.data,
          },
        ])
      } catch (error) {
        console.error("Error fetching statistics:", error)
      }
    }

    fetchStatistics()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (message) => {
    if (!message.trim()) return
    setInputValue("")
    setIsLoading(true)

    const { updatedMessages, updatedHistory } = updateChatState(
      messages,
      conversationHistory,
      [{ sender: "user", content: message, role: "user" }]
    )
    setMessages(updatedMessages)
    setConversationHistory(updatedHistory)

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: uuidv4(),
        sender: "bot",
        text: "Typing...",
      },
    ])

    try {
      const botResponse = await axios.post(apiUrl, {
        token: Cookies.get("token"),
        name: Cookies.get("name"),
        conversationId: IdConversation,
        messages: updatedHistory,
      })

      const parsedResponse = extractJsonFromMessage(botResponse.data)
      const responseText =
        parsedResponse?.response || "I couldn’t understand that."
      const responseData = parsedResponse?.data || null

      setMessages((prevMessages) => {
        const updated = prevMessages.filter((msg) => msg.text !== "Typing...")
        return [
          ...updated,
          {
            id: uuidv4(),
            sender: "bot",
            text: responseText,
            data: responseData,
          },
        ]
      })

      setConversationHistory((prevHistory) => [
        ...prevHistory,
        { role: "assistant", content: responseText },
      ])
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-poulin">
      <div className="chat-poulin-main">
        <div className="chat-poulin-main-messages">
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          handleSend={handleSend}
        />
      </div>
    </div>
  )
}

export default ChatPoulin
