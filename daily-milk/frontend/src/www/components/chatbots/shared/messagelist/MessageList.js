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
            <span className="message-text">
              {renderMessageText(msg.text, msg.sender)}
            </span>
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
const renderMessageText = (text, sender) => {
  let output = ""
  if (sender === "user") {
    console.log(text)
    output = text
  } else {
    console.log(text.message)
    output = text.message
  }

  return <pre>{output}</pre>
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id: ${id}`)
}

export default MessageList
