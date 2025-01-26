import React, { useEffect, useRef, useState } from "react"
import "./ChatHistory.css"

export const createDynamicAsciiTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available..."
  }

  // Campi da non formattare
  const nonFormattedFields = ["item_number", "description"]

  const headers = Object.keys(data[0])

  const formatNumber = (header, value) => {
    if (nonFormattedFields.includes(header)) {
      // Non formattare i campi specificati
      return value
    }
    if (!isNaN(value) && value !== null && value !== "") {
      return parseInt(value, 10).toLocaleString("it-IT")
    }
    return value
  }

  const columnWidths = headers.map((header) =>
    Math.max(
      header.length,
      ...data.map(
        (row) => String(formatNumber(header, row[header]) || "").length
      )
    )
  )

  const createRow = (row) =>
    "| " +
    headers
      .map((header, i) =>
        String(formatNumber(header, row[header]) || "").padEnd(columnWidths[i])
      )
      .join(" | ") +
    " |"

  const headerRow = createRow(Object.fromEntries(headers.map((h) => [h, h])))
  const separatorRow =
    "+-" + columnWidths.map((width) => "-".repeat(width)).join("-+-") + "-+"

  const dataRows = data.map((row) => createRow(row))

  const table = [
    separatorRow,
    headerRow,
    separatorRow,
    ...dataRows,
    separatorRow,
  ].join("\n")

  return table
}

const ChatHistory = ({ msgIds, messages, onDeleteChat }) => {
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
        <button
          className="delete-chat-button"
          onClick={onDeleteChat}
          title="Delete"
        >
          🗑️
        </button>
        <button className="comment-chat-button" title="Comment">
          ✏️
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
            <span>
              {debugModes[msg.id] ? (
                <pre>{JSON.stringify(msg, null, 2)}</pre>
              ) : (
                <div>
                  <pre
                    className={
                      msg.role === "user" ? "text-user" : "text-assistant"
                    }
                  >
                    {msg.data && Array.isArray(msg.data) && msg.data.length > 0
                      ? createDynamicAsciiTable(msg.data)
                      : msg.content}
                  </pre>
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
