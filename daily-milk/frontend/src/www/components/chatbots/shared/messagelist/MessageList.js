import React from "react"
import "./MessageList.css"

const MessageList = ({ messages }) => {
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
            <span className="message-text">{renderMessageText(msg.text)}</span>
            {msg.sender === "bot" && index !== 0 && msg.text !== "..." && (
              <div className="like-unlike-icons" style={{ float: "right" }}>
                <span
                  role="img"
                  aria-label="unlike"
                  onClick={() => handleUnlike(msg.id)}
                  title="Unlike"
                >
                  👎
                </span>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}

// Funzione per gestire il rendering del testo del messaggio
const renderMessageText = (text) => {
  try {
    // Se il testo è un oggetto JSON, lo formatta in modo leggibile
    if (typeof text === "string") {
      const parsedText = JSON.parse(text)
      return typeof parsedText === "object" ? (
        <pre>{JSON.stringify(parsedText, null, 2)}</pre>
      ) : (
        parsedText
      )
    } else if (typeof text === "object") {
      // Se è già un oggetto, lo stringifica
      return <pre>{JSON.stringify(text, null, 2)}</pre>
    } else {
      // Ritorna direttamente il testo come stringa
      return String(text)
    }
  } catch (error) {
    // Se non è un JSON valido, ritorna il testo grezzo
    return String(text)
  }
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
