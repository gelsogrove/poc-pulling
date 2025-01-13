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

const renderMessageText = (text, sender, debugMode) => {
  let output = ""

  if (sender === "user") {
    console.log(text)
    output = text
    output = output.replace(/```json/g, "").replace(/```/g, "")
  } else {
    try {
      //   text = text.message.replace(/```json/g, "").replace(/```/g, "")

      const parsedMessage = JSON.parse(text)
      // Mostra solo "response" quando debugMode è disattivato
      output = debugMode
        ? JSON.stringify(parsedMessage, null, 2) // Mostra l'intero oggetto in JSON
        : parsedMessage.response || "" // Mostra solo il valore di "response"
    } catch (error) {
      output = text.message
      console.log(error)
    }
  }

  if (debugMode) {
    return <pre>{output}</pre>
  } else {
    return output
  }
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
