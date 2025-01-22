import React, { useEffect, useRef } from "react"
import "./ChatHistory.css"

const ChatHistory = ({ messages, onDeleteChat }) => {
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="chat-history-container">
      <div className="chat-header">
        <button
          className="delete-chat-button"
          onClick={onDeleteChat}
          title="Delete Chat"
        >
          🗑️
        </button>
      </div>
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.role === "user" ? "user" : "assistant"
            }`}
          >
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  )
}

export default ChatHistory
