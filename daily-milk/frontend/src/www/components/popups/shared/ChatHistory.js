import React, { useEffect, useRef } from "react"
import "./ChatHistory.css"

const ChatHistory = ({ msgIds, messages, onDeleteChat }) => {
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handlePrint = () => {
    const printableContent = messages
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n")
    const newWindow = window.open("", "_blank")
    newWindow.document.write(`<pre>${printableContent}</pre>`)
    newWindow.document.close()
    newWindow.print()
  }

  return (
    <div className="chat-history-container">
      <div className="chat-header">
        <button
          className="delete-chat-button"
          onClick={onDeleteChat}
          title="Delete"
        >
          🗑️
        </button>
        <button
          className="print-chat-button"
          onClick={handlePrint}
          title="Print"
        >
          🖨️
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
            {msgIds.includes(msg.id) && (
              <span className="dislike-icon" title="Disliked">
                👎
              </span>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
    </div>
  )
}

export default ChatHistory
