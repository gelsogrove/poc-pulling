import Cookies from "js-cookie"
import React, { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatInput from "../shared/chatinput/ChatInput"
import MessageList from "../shared/messagelist/MessageList"
import "./ChatPoulin.css"
import {
  generateResponseWithContext,
  initializeData,
} from "./usage/api/utils_api.js"
import {
  addBotLoadingMessage,
  cleanText,
  formatBoldText,
  formatText,
  replaceBotMessageWithError,
} from "./utils"

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

const ChatPoulin = ({
  first_message,
  first_options,
  max_tokens,
  temperature,
  model,
  error_message,
  goodbye_message,
  ispay,
  filename,
  systemPrompt,
  local,
  server,
  openPanel,
}) => {
  const [inputValue, setInputValue] = useState("")
  const [, setVoiceMessage] = useState(null)
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const first_message1 = `Hello ${
    (Cookies.get("name") || "Guest").charAt(0).toUpperCase() +
    (Cookies.get("name") || "Guest").slice(1)
  }, how can I help you today?`
  const [messages, setMessages] = useState([
    { id: uuidv4(), sender: "bot", text: first_message1 },
  ])
  const [conversationHistory, setConversationHistory] = useState([
    { role: "assistant", content: first_message1 },
  ])

  const messagesEndRef = useRef(null)

  const apiUrl = window.location.hostname === "localhost" ? local : server

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
    if (typeof message !== "string" || !message.trim()) return

    if (conversationHistory.length === 1) {
      try {
        const data = await initializeData(apiUrl, systemPrompt, filename, model)

        setConversationHistory((prev) => [
          {
            role: "system",
            content: `data: ${JSON.stringify(data.customers)}`,
          },
          ...prev,
        ])
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }

    const userMessage = {
      id: uuidv4(),
      sender: "user",
      text: message,
    }

    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInputValue("")
    setIsLoading(true)

    addBotLoadingMessage(setMessages)

    try {
      const botResponse = await generateResponseWithContext(
        apiUrl,
        message,
        conversationHistory,
        systemPrompt,
        max_tokens,
        temperature,
        model
      )

      const formattedResponse = formatText(botResponse)
      let cleanedResponse = cleanText(formattedResponse)
      cleanedResponse = formatBoldText(cleanedResponse)

      setMessages((prevMessages) =>
        prevMessages.slice(0, -1).concat({
          id: uuidv4(),
          sender: "bot",
          text: cleanedResponse,
        })
      )

      setVoiceMessage(cleanedResponse.replace(/<[^>]+>/g, ""))

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: botResponse },
      ])
    } catch (error) {
      replaceBotMessageWithError(setMessages, error_message)
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: error_message },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrophoneClick = () => {
    setIsVoiceInput((prev) => !prev)
    console.log(isVoiceInput ? "Microfono disattivato" : "Microfono attivato")
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
            onClickMicro={handleMicrophoneClick}
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
