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

// Funzione aggiornata per gestire JSON annidato
const renderMessageText = (text) => {
  try {
    // Controlla se il testo è una stringa JSON
    if (typeof text === "string") {
      const parsedText = JSON.parse(text) // Primo livello di parsing

      // Controlla se "message" è un'altra stringa JSON
      if (parsedText.message && typeof parsedText.message === "string") {
        try {
          const nestedParsed = JSON.parse(parsedText.message) // Parsing del livello annidato

          // Mostra il JSON annidato ben formattato
          return <pre>{JSON.stringify(nestedParsed, null, 2)}</pre>
        } catch {
          // Se il parsing del livello annidato fallisce, mostra il valore grezzo
          return <pre>{parsedText.message.replace(/\\n/g, "\n")}</pre>
        }
      }

      // Se non c'è "message", mostra il JSON principale
      return <pre>{JSON.stringify(parsedText, null, 2)}</pre>
    }

    // Se il testo è già un oggetto, lo stringifichiamo e formattiamo
    if (typeof text === "object") {
      return <pre>{JSON.stringify(text, null, 2)}</pre>
    }

    // Per altri tipi di dati, restituiamo il valore come stringa
    return String(text)
  } catch (error) {
    // In caso di errore, restituisce il testo originale senza escape
    return <pre>{text.replace(/\\n/g, "\n")}</pre>
  }
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
