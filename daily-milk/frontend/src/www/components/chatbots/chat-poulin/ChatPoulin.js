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
  middlewareSQL,
  updateChatState,
} from "./utils"

const ChatPoulin = ({ openPanel }) => {
  // Stato per l'input dell'utente, il caricamento, i messaggi e la cronologia della conversazione
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationHistory, setConversationHistory] = useState([])

  // Riferimento per scorrere automaticamente fino all'ultimo messaggio
  const messagesEndRef = useRef(null)

  // URL base dell'API
  const apiUrl = "https://poulin-bd075425a92c.herokuapp.com/chatbot/response"

  // Genera un ID conversazione unico per ogni sessione
  const IdConversation = uuidv4()

  // Funzione per scorrere automaticamente fino all'ultimo messaggio
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Effetto per inizializzare la conversazione con un messaggio di benvenuto
  useEffect(() => {
    const userName = getUserName()
    const { updatedMessages, updatedHistory } = updateChatState(
      [],
      [],
      [
        {
          sender: "bot",
          content: `Hello, ${userName}! Welcome to the chat. How can I assist you today?`,
          role: "assistant",
        },
      ]
    )
    setMessages(updatedMessages)
    setConversationHistory(updatedHistory)
  }, [])

  // Effetto per scorrere automaticamente fino all'ultimo messaggio ogni volta che cambiano i messaggi
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Gestisce l'invio dei messaggi da parte dell'utente
  const handleSend = async (message) => {
    if (!message.trim()) return

    setInputValue("")
    setIsLoading(true)

    // 1. Aggiorna i messaggi e la cronologia con il messaggio dell'utente
    const { updatedMessages, updatedHistory } = updateChatState(
      messages,
      conversationHistory,
      [{ sender: "user", content: message, role: "user" }]
    )

    setMessages(updatedMessages)
    setConversationHistory(updatedHistory)

    try {
      // 2. Invia il messaggio all'API e ottiene la risposta del bot
      const botResponse = await axios.post(apiUrl, {
        token: Cookies.get("token"),
        name: Cookies.get("name"),
        conversationId: IdConversation,
        messages: updatedHistory,
      })

      // 3. Estrae e analizza la risposta del bot
      const parsedResponse = extractJsonFromMessage(botResponse.data.message)
      const sql = parsedResponse?.sql

      // Se il messaggio contiene una query SQL, passiamo al middlewareSQL
      if (sql) {
        // 4. Esegui la query SQL, inviando nuovamente lo storico al bot
        const finalHistory = await middlewareSQL(
          apiUrl,
          sql,
          updatedHistory,
          IdConversation
        )
        setConversationHistory(finalHistory)

        // 5. Nel frattempo, aggiorniamo i messaggi anche con l’ultima risposta del bot
        const { updatedMessages: finalMessages } = updateChatState(
          updatedMessages,
          updatedHistory,
          [
            {
              sender: "bot",
              content: finalHistory[finalHistory.length - 1].content,
              role: "assistant",
            },
          ]
        )
        setMessages(finalMessages)
      } else {
        // 6. Se non c'è SQL, aggiorniamo la cronologia normalmente
        const botUpdate = updateChatState(updatedMessages, updatedHistory, [
          {
            sender: "bot",
            content: botResponse.data.message,
            role: "assistant",
          },
        ])
        setMessages(botUpdate.updatedMessages)
        setConversationHistory(botUpdate.updatedHistory)
      }
    } catch (error) {
      // Gestisce eventuali errori durante l'invio o la risposta
      const errorState = handleError(error, messages, conversationHistory)
      setMessages(errorState.updatedMessages)
      setConversationHistory(errorState.updatedHistory)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-poulin">
      <div className="chat-poulin-main">
        <div className="chat-poulin-main-messages">
          {/* Mostra la lista dei messaggi */}
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>
        {/* Input per l'invio dei messaggi */}
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          handleSend={handleSend}
        />
      </div>
      {/* Pannello laterale per ulteriori informazioni */}
      {openPanel && (
        <div
          className="chat-poulin-right"
          style={{
            width: "50%",
            transition: "width 0.3s ease",
            padding: "20px",
          }}
        >
          <Usage />
        </div>
      )}
    </div>
  )
}

export default ChatPoulin
