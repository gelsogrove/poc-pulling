// MessageList.js - Aggiornato per parsing migliore e gestione lingua
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

  const renderMessageText = (text, sender, debugMode, data) => {
    if (text.trim().startsWith("<table") || text.includes("<thead>")) {
      return <div dangerouslySetInnerHTML={{ __html: text }} />
    }

    if (sender === "user") {
      return text
    } else {
      return (
        <div>
          <p>{text}</p>
          {debugMode && data && (
            <pre className="json-data">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      )
    }
  }

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
              {renderMessageText(
                msg.text,
                msg.sender,
                debugModes[msg.id] || true,
                msg.data
              )}
            </span>

            {msg.sender === "bot" && (
              <div className="like-unlike-icons">
                <span
                  role="img"
                  aria-label="toggle-debug"
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

export default MessageList
