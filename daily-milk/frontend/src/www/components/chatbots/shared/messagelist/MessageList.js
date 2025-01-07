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

// Funzione aggiornata per gestire i messaggi JSON e formattare il testo
const renderMessageText = (text) => {
  try {
    // Se il testo è una stringa JSON valida, lo parsiamo
    if (typeof text === "string") {
      const parsedText = JSON.parse(text)

      // Se il JSON è un oggetto o un array, lo mostriamo formattato
      if (typeof parsedText === "object") {
        return <pre>{JSON.stringify(parsedText, null, 2)}</pre>
      }

      // Altrimenti restituiamo il testo parsato
      return parsedText
    }

    // Se è già un oggetto, lo stringifichiamo e formattiamo
    if (typeof text === "object") {
      return <pre>{JSON.stringify(text, null, 2)}</pre>
    }

    // Per altri tipi, li trasformiamo in stringa
    return String(text)
  } catch (error) {
    // Se il parsing fallisce (non è JSON valido), mostriamo il testo originale
    return <pre>{text.replace(/\\n/g, "\n")}</pre>
  }
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
