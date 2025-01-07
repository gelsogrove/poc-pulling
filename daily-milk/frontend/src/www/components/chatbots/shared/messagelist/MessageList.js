import React from "react"
import "./MessageList.css"

const MessageList = ({ messages }) => {
  return (
    <div className="chat-messages">
      {messages
        .filter((msg) => msg.sender !== "system")
        .map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${
              msg.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            <span className="message-text">
              {(() => {
                if (typeof msg.text === "string") {
                  return msg.text
                }
                try {
                  // Prova a parsare JSON e restituirlo
                  return (
                    <pre className="message-text">
                      {JSON.stringify(JSON.parse(msg.text), null, 2)}
                    </pre>
                  )
                } catch (e) {
                  // Ritorna testo grezzo come fallback
                  return <pre className="message-text">{msg.text}</pre>
                }
              })()}
            </span>
          </div>
        ))}
    </div>
  )
}

const handleUnlike = (id) => {
  console.log(`Unliked message with id...: ${id}`)
}

export default MessageList
