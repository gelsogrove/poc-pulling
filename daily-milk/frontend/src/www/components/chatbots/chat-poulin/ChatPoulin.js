import Cookies from "js-cookie"
import React, { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatInput from "../shared/chatinput/ChatInput"
import MessageList from "../shared/messagelist/MessageList"
import "./ChatPoulin.css"
import { response } from "./usage/api/utils_api.js"

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

import Usage from "./usage/Usage.js"

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

  const first_message = `Hello ${
    (Cookies.get("name") || "Guest").charAt(0).toUpperCase() +
    (Cookies.get("name") || "Guest").slice(1)
  }, how can I help you today?`
  const [messages, setMessages] = useState([
    { id: uuidv4(), sender: "bot", text: first_message },
  ])
  const [conversationHistory, setConversationHistory] = useState([
    { role: "assistant", content: first_message },
  ])

  const messagesEndRef = useRef(null)

  const apiUrl = "https://poulin-bd075425a92c.herokuapp.com"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const [IdConversation, setIDConversation] = useState(0)

  useEffect(() => {
    const IdConversation = uuidv4()
    setIDConversation(IdConversation)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (message) => {
    if (typeof message !== "string" || !message.trim()) {
      return
    }

    try {
      // LOADING
      setInputValue("")
      setIsLoading(true)

      // GET USER MESSAGE
      const userMessage = {
        id: uuidv4(),
        sender: "user",
        text: message,
      }
      setMessages((prevMessages) => [...prevMessages, userMessage])

      // BOT ANSWER
      const botResponse = await response(
        apiUrl,
        Cookies.get("token"),
        Cookies.get("name"),
        IdConversation,
        conversationHistory
      )

      // SET ANSWER
      setMessages((prevMessages) =>
        prevMessages.concat({
          id: uuidv4(),
          sender: "bot",
          text: botResponse,
        })
      )

      // SET HISTORY
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: botResponse },
      ])
    } catch (error) {
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        {
          role: "assistant",
          content: error.message || "Si è verificato un errore.",
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
