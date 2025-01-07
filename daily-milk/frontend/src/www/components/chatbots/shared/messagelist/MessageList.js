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
              {(() => {
                try {
                  console.log(msg.text)

                  const parsedText = JSON.parse(msg.text)
                  return typeof parsedText === "object"
                    ? JSON.stringify(parsedText, null, 2)
                    : parsedText // Restituisce il testo se non è un oggetto
                } catch (e) {
                  console.log(msg.text)
                  return <pre className="message-text">{msg.text}</pre> // Ritorna solo testo
                }
              })()}
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

const handleUnlike = (id) => {
  console.log(`Unliked message with id...: ${id}`)
}

export default MessageList
