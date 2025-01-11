import React, { useState } from "react"
import "./MessageList.css"

const MessageList = ({ messages }) => {
  const [debugModes, setDebugModes] = useState({}) // Stato per ogni messaggio

  // Funzione per attivare/disattivare il debugMode di un messaggio specifico
  const toggleDebugMode = (id) => {
    setDebugModes((prev) => ({
      ...prev,
      [id]: !prev[id], // Inverte il valore di debugMode solo per il messaggio selezionato
    }))
  }

  return (
    <div className="chat-messages">
      {messages
        .filter((msg) => msg.sender !== "system")
        .map((msg, index) => (
          <div
            key={msg.id}
            className={`chat-message ${
              msg.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            <span className="message-text">
              {renderMessageText(
                msg.text,
                msg.sender,
                debugModes[msg.id] || false // Usa lo stato specifico del messaggio
              )}
            </span>
            {msg.sender === "bot" && index !== 0 && msg.text !== "..." && (
              <div className="like-unlike-icons">
                {/* Icona del pollice */}
                <span
                  role="img"
                  aria-label="unlike"
                  onClick={() => handleUnlike(msg.id)}
                  title="Unlike"
                >
                  👎
                </span>

                {/* Icona della coccinella */}
                <span
                  role="img"
                  aria-label="debug"
                  onClick={() => toggleDebugMode(msg.id)} // Cambia solo per questo messaggio
                  title={`Toggle Debug Mode (${
                    debugModes[msg.id] ? "ON" : "OFF"
                  })`}
                >
                  🐞
                </span>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}

// Funzione aggiornata per parsare e formattare il JSON annidato
const renderMessageText = (text, sender, debugMode) => {
  let output = ""
  if (sender === "user") {
    console.log(text)
    output = text
  } else {
    try {
      const parsedMessage = JSON.parse(text.message)
      output = debugMode
        ? JSON.stringify(parsedMessage, null, 2)
        : parsedMessage.response
    } catch (error) {
      output = "Invalid message format" // Messaggio in caso di JSON non valido
    }
  }

  return <pre>{output}</pre>
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
