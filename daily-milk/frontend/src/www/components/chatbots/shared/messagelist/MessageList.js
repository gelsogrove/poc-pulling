import React, { useState } from "react"
import "./MessageList.css"

const MessageList = ({ messages }) => {
  const [debugModes, setDebugModes] = useState({})

  const toggleDebugMode = (id) => {
    setDebugModes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleUnlike = (id) => {
    console.log(`Unliked message with id: ${id}`)
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
                debugModes[msg.id] || false
              )}
            </span>

            {msg.sender === "bot" &&
              index !== 0 &&
              msg.text !== "Typing..." && (
                <div className="like-unlike-icons">
                  <span
                    role="img"
                    aria-label="unlike"
                    onClick={() => handleUnlike(msg.id)}
                    title="Unlike"
                  >
                    👎
                  </span>
                  <span
                    role="img"
                    aria-label="debug"
                    onClick={() => toggleDebugMode(msg.id)}
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
  if (sender === "user") {
    return text
  } else {
    try {
      const parsed = JSON.parse(text)
      if (debugMode) {
        return <pre>{JSON.stringify(parsed, null, 2)}</pre>
      } else {
        return parsed.response || text
      }
    } catch {
      return text
    }
  }
}

export default MessageList
