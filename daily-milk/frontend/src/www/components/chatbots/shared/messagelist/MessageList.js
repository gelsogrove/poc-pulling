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

// Funzione aggiornata per gestire i messaggi JSON e rimuovere i caratteri di escape
const renderMessageText = (text) => {
  try {
    // Se il testo è una stringa JSON valida
    if (typeof text === "string") {
      const parsedText = JSON.parse(text)

      // Controlla se il JSON ha una proprietà "message" che è un'altra stringa JSON
      if (parsedText.message && typeof parsedText.message === "string") {
        const nestedParsed = JSON.parse(parsedText.message)

        // Mostra il JSON annidato ben formattato
        return <pre>{JSON.stringify(nestedParsed, null, 2)}</pre>
      }

      // Mostra il JSON principale ben formattato
      if (typeof parsedText === "object") {
        return <pre>{JSON.stringify(parsedText, null, 2)}</pre>
      }

      // Restituisci il testo semplice se non è un oggetto JSON
      return parsedText
    }

    // Se il testo è già un oggetto
    if (typeof text === "object") {
      return <pre>{JSON.stringify(text, null, 2)}</pre>
    }

    // Restituisci come stringa se è un altro tipo
    return String(text)
  } catch (error) {
    // Restituisci il testo grezzo senza escape
    return <pre>{text.replace(/\\n/g, "\n")}</pre>
  }
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
