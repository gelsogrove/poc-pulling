import axios from "axios"
import Cookies from "js-cookie"
import React, { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import ChatInput from "../shared/chatinput/ChatInput"
import MessageList from "../shared/messagelist/MessageList"
import "./ChatPoulin.css"
import Usage from "./usage/Usage"

import {
  extractJsonFromMessage,
  getUserName,
  handleError,
  updateChatState,
} from "./utils"

const ChatPoulin = ({ openPanel }) => {
  const [refreshUsage, setRefreshUsage] = useState(false)
  // Messages displayed in the chat
  const [messages, setMessages] = useState([])
  const [, setData] = useState([])
  // Actual conversation history sent/received
  const [conversationHistory, setConversationHistory] = useState([])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const apiUrl = "https://poulin-bd075425a92c.herokuapp.com/chatbot/response"
  const IdConversation = uuidv4()

  // Scroll to the bottom automatically
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Initial welcome message
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
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Function to send a message
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

    // Show a temporary loading message
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: uuidv4(),
        sender: "bot",
        text: "Typing...",
      },
    ])

    try {
      setRefreshUsage(!refreshUsage)

      const botResponse = await axios.post(apiUrl, {
        token: Cookies.get("token"),
        name: Cookies.get("name"),
        conversationId: IdConversation,
        messages: updatedHistory,
      })

      const parsedResponse = extractJsonFromMessage(botResponse.data.response)
      setData(botResponse?.data)

      const responseText = parsedResponse || "I couldn’t understand that."

      // Replace the loading message with the response text
      setMessages((prevMessages) => {
        const updated = prevMessages.filter((msg) => msg.text !== "Typing...")
        return [
          ...updated,
          {
            id: uuidv4(),
            sender: "bot",
            text: responseText,
            data: botResponse?.data?.data,
            query: botResponse?.data?.query,
            triggerAction: botResponse?.data?.triggerAction,
          },
        ]
      })

      // Update conversation history

      setConversationHistory((prevHistory) => {
        // Inizia con gli elementi obbligatori
        const newHistory = [
          ...prevHistory,
          { role: "assistant", content: responseText },
        ]

        // Aggiungi l'elemento condizionale solo se botResponse?.data?.data esiste
        /*  if (botResponse?.data?.data) {
          newHistory.push({
            role: "system",
            content: JSON.stringify(botResponse.data.data),
          })
        }
          */

        return newHistory
      })
    } catch (error) {
      console.error("Error in handleSend:", error)
      const { updatedMessages: errMsgs, updatedHistory: errHist } = handleError(
        error,
        messages,
        conversationHistory
      )
      setMessages(errMsgs)
      setConversationHistory(errHist)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-poulin">
      <div className="chat-poulin-main">
        <div className="chat-poulin-main-messages">
          <MessageList
            conversationHistory={conversationHistory}
            messages={messages}
          />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          handleSend={handleSend}
        />
      </div>

      {openPanel && (
        <div
          className="chat-poulin-right"
          style={{
            width: "50%",
            transition: "width 0.3s ease",
            padding: "20px",
          }}
        >
          <Usage IdConversation={IdConversation} refresh={refreshUsage} />
        </div>
      )}
    </div>
  )
}

export default ChatPoulin
