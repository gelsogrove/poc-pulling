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
    // Se è un messaggio dell’utente, è quasi sempre testo semplice
    output = text.replace(/```json/g, "").replace(/```/g, "")
  } else {
    // Se è un messaggio del bot, proviamo a interpretarlo come JSON
    try {
      const parsedMessage = JSON.parse(text)
      // Se debugMode è ON, mostriamo l'intero JSON formattato
      if (debugMode) {
        output = JSON.stringify(parsedMessage, null, 2)
      } else {
        // Altrimenti, mostriamo solo la chiave 'response' (o un'altra chiave a tua scelta)
        output = parsedMessage.response || ""
      }
    } catch (error) {
      // Se il parse fallisce, mostriamo direttamente `text` come semplice stringa
      output = text
    }
  }

  // Se il debugMode è attivo, avvolgiamo l'output in <pre> per formattarlo
  return debugMode ? <pre>{output}</pre> : output
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
