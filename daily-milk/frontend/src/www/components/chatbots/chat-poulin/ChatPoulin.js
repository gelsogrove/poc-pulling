import axios from "axios"
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

      let botResponse = await response(
        apiUrl,
        Cookies.get("token"),
        Cookies.get("name"),
        IdConversation,
        [...conversationHistory, { role: "user", content: message }]
      )

      let content
      let parsedResponse
      try {
        parsedResponse = JSON.parse(botResponse.message)
        content = parsedResponse.response
      } catch {
        parsedResponse = {}
        content = botResponse.message
      }

      // MIDLEWARA
      if (parsedResponse.sql !== undefined) {
        botResponse = await middlewareSQL(
          botResponse,
          conversationHistory,
          setConversationHistory
        )
      }

      setMessages((prevMessages) =>
        prevMessages.concat({
          id: uuidv4(),
          sender: "bot",
          text: botResponse,
        })
      )

      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content, // SOLO TESTO
        },
      ])
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

  const middlewareSQL = async (
    botResponse,
    conversationHistory,
    setConversationHistory
  ) => {
    try {
      // Step 1: Parse il messaggio del bot per estrarre la query SQL
      const parsedResponse = JSON.parse(botResponse.message || "{}")
      const sqlQuery = parsedResponse.sql

      // Step 2: Controlla se il messaggio contiene una query SQL
      if (!sqlQuery) {
        return botResponse // Nessuna query SQL presente, restituisce la risposta originale
      }

      // Step 3: Esegui la query SQL tramite l'API con gestione degli errori
      let sqlResponse
      try {
        const apiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(
          sqlQuery
        )}`
        sqlResponse = await axios.get(apiUrl) // Esegue la chiamata API per eseguire la query SQL
      } catch (error) {
        // Step 4: Gestione degli errori della query SQL
        // Se la query fallisce, restituisce un messaggio di errore al bot
        return {
          ...botResponse,
          message: JSON.stringify({
            response:
              "Query Error: Unable to execute the SQL query. Please check the query or try again later.",
          }),
        }
      }

      // Step 5: Prepara il messaggio con i risultati SQL da inviare a OpenAI
      const sqlResultMessage = {
        role: "system",
        content: `SQL Query Result: ${JSON.stringify(sqlResponse.data)}`, // Contiene i risultati della query SQL
      }

      // Step 6: Trasforma i risultati SQL in una risposta NLP tramite OpenAI
      const openAiResponse = await response(
        "https://api.openai.com/v1/chat/completions", // Endpoint OpenAI
        Cookies.get("token"), // Token di autenticazione
        Cookies.get("name"), // Nome utente (opzionale)
        uuidv4(), // Nuovo ID per la conversazione, se necessario
        [sqlResultMessage] // Invio solo del messaggio con i risultati SQL
      )

      // Step 7: Aggiungi la risposta NLP di OpenAI alla cronologia della conversazione
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: openAiResponse.message || "No response from OpenAI.", // Aggiunge la risposta NLP
        },
      ])

      // Step 8: Restituisce al bot una risposta combinata con OpenAI
      return {
        ...botResponse,
        message: openAiResponse.message || "No response from OpenAI.", // Include solo la risposta NLP
      }
    } catch (error) {
      // Step 9: Gestione degli errori generali del middleware SQL
      throw new Error("Failed to process SQL query.") // Lancia un'eccezione per errori non gestiti
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
