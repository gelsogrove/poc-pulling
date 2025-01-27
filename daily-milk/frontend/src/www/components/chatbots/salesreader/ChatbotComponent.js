import React, { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

import ChatInput from "../shared/chatinput/ChatInput"
import MessageList from "../shared/messagelist/MessageList"
import Usage from "../usage/Usage"
import "./ChatbotComponent.css"

import { sendMessageToChatbot } from "./api/chatbot_api"
import {
  extractJsonFromMessage,
  getUserName,
  handleError,
  updateChatState,
} from "./utils"

import Cookies from "js-cookie"
import { fetchUsageData, getPromptDetails } from "../usage/api/utils_api"

const ChatBotComponent = ({ idPrompt, openPanel }) => {
  const [refreshUsage, setRefreshUsage] = useState(false)
  const [messages, setMessages] = useState([])
  const [, setData] = useState([])
  const [conversationHistory, setConversationHistory] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [IdConversation] = useState(uuidv4()) // Initialize conversation ID once

  // ---- Stati per Usage ----
  const [usageData, setUsageData] = useState(null)
  const [currentChatDifference, setCurrentChatDifference] = useState(0)
  const [temperature, setTemperature] = useState(null)
  const [model, setModel] = useState(null)
  const [error, setError] = useState(null)

  // Nome fisso del cookie
  const cookieKey = "initialChatTotal"

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Messaggio iniziale di benvenuto
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

  /**
   * [1] RESET del cookie appena la chat si "apre" (monta il componente).
   *     Così, ogni volta che ricarichi/riapri la chat,
   *     parti senza cookie.
   */
  useEffect(() => {
    Cookies.remove(cookieKey)
  }, [])

  /**
   * [2] Fetch usage e calcolo differenza.
   *     - Se il cookie NON c'è, lo creiamo con totalCurrentMonth
   *     - Se il cookie C'È, calcoliamo differenza
   *
   * Si richiama inizialmente (montaggio) e ogni volta che cambiamo idPrompt
   * o facciamo toggle di refreshUsage (cioè inviando un messaggio).
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Dati di usage
        const data = await fetchUsageData()
        setUsageData(data)

        // 2) Dettagli del prompt
        const prompt = await getPromptDetails(idPrompt)
        setTemperature(prompt.temperature)
        setModel(prompt.model)

        // 3) Se il cookie non esiste, lo creiamo (session cookie)
        if (!Cookies.get(cookieKey)) {
          Cookies.set(cookieKey, data.totalCurrentMonth)
          setCurrentChatDifference(0)
        } else {
          // Se esiste, calcoliamo la differenza
          const initialTotal = parseFloat(Cookies.get(cookieKey))
          const difference = data.totalCurrentMonth - initialTotal
          setCurrentChatDifference(difference)
        }
      } catch (err) {
        console.error("Error fetching usage data:", err)
        setError("Failed to load data. Please try again.")
      }
    }

    fetchData()
  }, [idPrompt, refreshUsage])

  // Funzione per inviare un messaggio
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

    // Aggiungo "Typing..."
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: uuidv4(),
        sender: "bot",
        text: "Typing...",
      },
    ])

    try {
      const botResponse = await sendMessageToChatbot(
        IdConversation,
        updatedHistory,
        idPrompt
      )

      const parsedResponse = extractJsonFromMessage(botResponse.response)
      setData(botResponse?.data)

      const responseText = parsedResponse || "I couldn’t understand that."

      // Rimuovo "Typing..." e aggiungo risposta
      const id = uuidv4()
      setMessages((prevMessages) => {
        const updated = prevMessages.filter((msg) => msg.text !== "Typing...")
        return [
          ...updated,
          {
            id,
            sender: "bot",
            text: responseText,
            data: botResponse?.data,
            query: botResponse?.query,
            triggerAction: botResponse?.triggerAction,
          },
        ]
      })

      // Aggiorno conversationHistory
      setConversationHistory((prevHistory) => [
        ...prevHistory,
        {
          id,
          role: "assistant",
          content: responseText,
          triggerAction: botResponse?.triggerAction,
          query: botResponse?.query,
          data: botResponse?.data,
        },
      ])
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

    // Questo toggle forzerà un nuovo fetch usage nel useEffect precedente
    setRefreshUsage((prev) => !prev)
  }

  return (
    <div className="chatbot">
      <div className="chatbot-main">
        <div className="chatbot-messages">
          <MessageList
            openPanel={openPanel}
            idPrompt={idPrompt}
            IdConversation={IdConversation}
            conversationHistory={conversationHistory}
            messages={messages}
            refresh={refreshUsage}
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
          className="chatbot-right"
          style={{
            width: "35%",
            transition: "width 0.3s ease",
            padding: "20px",
          }}
        >
          <Usage
            usageData={usageData}
            currentChatDifference={currentChatDifference}
            temperature={temperature}
            model={model}
            idPrompt={idPrompt}
            IdConversation={IdConversation}
            error={error}
          />
        </div>
      )}
    </div>
  )
}

export default ChatBotComponent
