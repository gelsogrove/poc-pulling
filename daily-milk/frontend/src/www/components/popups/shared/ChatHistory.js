import React, { useEffect, useRef, useState } from "react"
import { createDynamicAsciiTable } from "../../../components/chatbots/shared/utils"
import "./ChatHistory.css"

const ChatHistory = ({
  msgIds,
  username,
  messages,
  onDeleteChat,
  model,
  temperature,
}) => {
  const [debugModes, setDebugModes] = useState({})
  const chatEndRef = useRef(null)

  const toggleDebugMode = (msgId) => {
    setDebugModes((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }))
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="chat-history-container">
      <div className="chat-header">
        <div className="header-item">
          <b>Username:</b>
          <span>{username}</span>
        </div>
        <div className="header-item">
          <b>Model:</b>
          <span>{model}</span>
        </div>
        <div className="header-item">
          <b>Temperature:</b>
          <span>{temperature}</span>
        </div>
        <div className="delete-button-container">
          <button
            className="delete-chat-button"
            onClick={onDeleteChat}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.role === "user" ? "user" : "assistant"
            }`}
          >
            <span>
              {debugModes[msg.id] ? (
                <pre>{JSON.stringify(msg, null, 2)}</pre>
              ) : (
                <div>
                  <pre
                    className={
                      msg.role === "user" ? "text-user" : "text-assistant"
                    }
                    dangerouslySetInnerHTML={{
                      __html:
                        msg.data &&
                        Array.isArray(msg.data) &&
                        msg.data.length > 0
                          ? createDynamicAsciiTable(msg.data)
                          : msg.content,
                    }}
                  />
                </div>
              )}
            </span>
            {msg.role === "assistant" && (
              <div className="message-actions">
                {msgIds.includes(msg.id) && (
                  <span className="dislike-icon" title="Disliked">
                    👎
                  </span>
                )}
                <span
                  role="img"
                  aria-label="debug"
                  onClick={() => toggleDebugMode(msg.id)}
                  title="Toggle debug mode"
                  className="debug-icon"
                >
                  🐞
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  )
}

export default ChatHistory
