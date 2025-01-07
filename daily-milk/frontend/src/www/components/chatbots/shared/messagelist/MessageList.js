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

// Funzione aggiornata per parsare e formattare il JSON annidato
const renderMessageText = (text) => {
  try {
    // Primo livello di parsing
    if (typeof text === "string") {
      const parsedText = JSON.parse(text)

      // Se "message" contiene un'altra stringa JSON
      if (parsedText.message && typeof parsedText.message === "string") {
        try {
          const nestedParsed = JSON.parse(
            parsedText.message.replace(/\\n/g, "").replace(/\\"/g, '"')
          )

          // Mostra il JSON annidato formattato
          return <pre>{JSON.stringify(nestedParsed, null, 2)}</pre>
        } catch {
          // Rimuove escape chars e mostra il testo grezzo
          return (
            <pre>
              {parsedText.message.replace(/\\n/g, "\n").replace(/\\"/g, '"')}
            </pre>
          )
        }
      }

      // Mostra il JSON principale se non è annidato
      return <pre>{JSON.stringify(parsedText, null, 2)}</pre>
    }

    // Se il testo è già un oggetto
    if (typeof text === "object") {
      return <pre>{JSON.stringify(text, null, 2)}</pre>
    }

    // Per qualsiasi altro tipo, restituisce come stringa
    return String(text)
  } catch (error) {
    // Se il parsing fallisce, rimuove escape chars e mostra il testo grezzo
    return <pre>{text.replace(/\\n/g, "\n").replace(/\\"/g, '"')}</pre>
  }
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
