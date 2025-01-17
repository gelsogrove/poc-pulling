import React, { useState } from "react"
import "./MessageList.css"

const MessageList = ({ messages }) => {
  const [debugModes, setDebugModes] = useState({})

  const toggleDebugMode = (id) => {
    setDebugModes((prev) => {
      const newVal = !prev[id]
      console.log(`Toggling debugMode for message ${id}: ${newVal}`)
      return {
        ...prev,
        [id]: newVal,
      }
    })
  }

  const handleUnlike = (id) => {
    console.log(`Unliked message with id: ${id}`)
  }

  const renderMessageText = (msg, text, sender, debugMode) => {
    console.log(
      `renderMessageText chiamata per il messaggio ${msg.id} con debugMode = ${debugMode}`
    )

    if (sender === "user") {
      return <span>{text}</span>
    } else {
      try {
        const parsed = JSON.parse(text)

        if (debugMode) {
          return <pre>{JSON.stringify(msg, null, 2)}</pre>
        } else if (parsed.response) {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: parsed.response }}
              style={{ whiteSpace: "pre-line" }} // Aggiungi questo stile per supportare gli a capo
            />
          )
        } else {
          return <span>{text}</span>
        }
      } catch (error) {
        console.log(
          `Errore nel parsing JSON per il messaggio ${msg.id}:`,
          error
        )
        if (debugMode) {
          return <pre>{JSON.stringify(msg, null, 2)}</pre>
        } else {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: text }}
              style={{ whiteSpace: "pre-line" }} // Aggiungi questo stile per supportare gli a capo
            />
          )
        }
      }
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
                msg,
                msg.text,
                msg.sender,
                debugModes[msg.id] || false
              )}
            </span>

            {/* Se il messaggio possiede dati, visualizzali */}
            {msg.data && <pre>{JSON.stringify(msg.data, null, 2)}</pre>}

            {msg.sender === "bot" && msg.text !== "Typing..." && msg.data && (
              <div className="like-unlike-icons">
                <span
                  role="img"
                  aria-label="unlike"
                  onClick={() => handleUnlike(msg.id)}
                  title="Unlike"
                  style={{ cursor: "pointer", marginRight: "8px" }}
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
                  style={{ cursor: "pointer" }}
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
