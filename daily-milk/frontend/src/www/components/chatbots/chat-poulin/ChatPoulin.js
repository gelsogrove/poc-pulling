import Cookies from "js-cookie"
import React, { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatInput from "../shared/chatinput/ChatInput"
import MessageList from "../shared/messagelist/MessageList"
import "./ChatPoulin.css"
import { response } from "./usage/api/utils_api.js"
import Usage from "./usage/Usage.js"

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const ChatPoulin = ({ openPanel }) => {
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationHistory, setConversationHistory] = useState([])

  const messagesEndRef = useRef(null)

  const apiUrl = "https://poulin-bd075425a92c.herokuapp.com"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const [IdConversation, setIDConversation] = useState(0)

  useEffect(() => {
    const IdConversation = uuidv4()
    setIDConversation(IdConversation)

    // Recupera il nome dall'utente
    const userName = ((name) =>
      name
        ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        : "Guest")(Cookies.get("name") || "Guest")

    // Aggiungi il messaggio iniziale di benvenuto
    const initialBotMessage = {
      id: uuidv4(),
      sender: "bot",
      text: {
        message: JSON.stringify({
          response: `Hello, ${userName}! Welcome to the chat. How can I assist you today?`,
        }),
      },
    }

    setMessages([initialBotMessage])
    setConversationHistory([
      {
        role: "assistant",
        content: `Hello, ${userName}! Welcome to the chat. How can I assist you today?`,
      },
    ])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (message) => {
    if (typeof message !== "string" || !message.trim()) {
      return
    }

    try {
      setInputValue("")
      setIsLoading(true)

      const userMessage = {
        id: uuidv4(),
        sender: "user",
        text: message,
      }
      setMessages((prevMessages) => [...prevMessages, userMessage])

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: message },
      ])

      const botResponse = await response(
        apiUrl,
        Cookies.get("token"),
        Cookies.get("name"),
        IdConversation,
        [...conversationHistory, { role: "user", content: message }]
      )

      let content
      try {
        content = JSON.parse(botResponse.message).response
      } catch {
        content = botResponse.message
      }

      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content,
        },
      ])

      setMessages((prevMessages) =>
        prevMessages.concat({
          id: uuidv4(),
          sender: "bot",
          text: botResponse,
        })
      )
    } catch (error) {
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        {
          role: "assistant",
          content: error.message || "An error occurred.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-poulin">
      <br />
      <div className="chat-poulin-main">
        <div className="chat-poulin-main-messages">
          <MessageList messages={messages} IsReturnTable={true} />
          <div ref={messagesEndRef} />
        </div>
        <div>
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            handleSend={handleSend}
          />
        </div>
      </div>
      <div
        className="chat-poulin-right"
        style={{
          width: openPanel ? "50%" : "0%",
          transition: "width 0.3s ease",
          padding: openPanel ? "20px" : "0px",
        }}
      >
        {openPanel && <Usage IdConversation={IdConversation} />}
      </div>
    </div>
  )
}

export default ChatPoulin
