import Cookies from "js-cookie"
import { useEffect, useRef, useState } from "react"
import "./MessageList.css"

export const createDynamicAsciiTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available"
  }

  const headers = Object.keys(data[0])

  const formatNumber = (value) => {
    if (!isNaN(value) && value !== null && value !== "") {
      return parseInt(value, 10).toLocaleString("it-IT")
    }
    return value
  }

  const columnWidths = headers.map((header) =>
    Math.max(
      header.length,
      ...data.map((row) => String(formatNumber(row[header]) || "").length)
    )
  )

  const createRow = (row) =>
    "| " +
    headers
      .map((header, i) =>
        String(formatNumber(row[header]) || "").padEnd(columnWidths[i])
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

const MessageList = ({
  IdConversation,
  conversationHistory,
  messages,
  refresh,
}) => {
  const [debugModes, setDebugModes] = useState({})
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [buttonPosition, setButtonPosition] = useState("50%")
  const messagesEndRef = useRef(null)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Show or hide the scroll button based on the number of messages
    setShowScrollButton(messages.length > 10)
  }, [messages])

  useEffect(() => {
    // Adjust button position based on refresh prop
    if (refresh) {
      setButtonPosition("140px")
    } else {
      setButtonPosition("50%")
    }
  }, [refresh])

  function getCurrentDateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const handleUnlike = async (msgId, conversationHistory, IdConversation) => {
    const payload = {
      conversationHistory: conversationHistory,
      conversationId: IdConversation,
      msgId,
      dataTime: getCurrentDateTime(),
      token: Cookies.get("token"),
    }

    try {
      const response = await fetch(
        "https://poulin-bd075425a92c.herokuapp.com/unlike/new",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      if (response.ok) {
        console.log("Message unliked successfully")

        const unlikeIcons = document.querySelectorAll(".like-unlike-icons span")
        unlikeIcons.forEach((icon) => {
          icon.style.color = "gray"
          icon.style.pointerEvents = "none"
          icon.setAttribute("disabled", "true")
        })

        const submitButton = document.querySelector(".btn.btn-primary.btn-wide")
        if (submitButton) {
          submitButton.style.color = "gray"
          submitButton.style.pointerEvents = "none"
          submitButton.setAttribute("disabled", "true")
        }

        const messageInput = document.querySelector(".form-control.input-wide")
        if (messageInput) {
          messageInput.style.backgroundColor = "#f5f5f5"
          messageInput.style.pointerEvents = "none"
          messageInput.setAttribute("disabled", "true")
        }
      } else {
        console.error("Failed to unlike the message:", response.statusText)
      }
    } catch (error) {
      console.error("Error in unliking message:", error)
    }
  }

  const copyContent = (id) => {
    const messageElement = document.querySelector(`[data-id='${id}']`)
    if (messageElement) {
      const contentToCopy = Array.from(messageElement.children)
        .filter((child) => !child.classList.contains("like-unlike-icons"))
        .map((child) => child.innerText)
        .join("\n")
      navigator.clipboard.writeText(contentToCopy).then(
        () => {
          console.log("Content copied to clipboard")
        },
        (err) => {
          console.error("Failed to copy content: ", err)
        }
      )
    }
  }

  const renderMessageText = (msg, text, sender, debugMode) => {
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
              style={{ whiteSpace: "pre-line" }}
            />
          )
        } else {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: text }}
              style={{ whiteSpace: "pre-line" }}
            />
          )
        }
      } catch (error) {
        console.log(`Error parsing JSON for message ${msg.id}:`, error)
        return debugMode ? (
          <pre>{JSON.stringify(msg, null, 2)}</pre>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: text }}
            style={{ whiteSpace: "pre-line" }}
          />
        )
      }
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages
          .filter((msg) => msg.sender !== "system")
          .map((msg, index) => (
            <div
              data-id={msg.id}
              key={msg.id}
              className={`chat-message ${
                msg.sender === "user" ? "user-message" : "bot-message"
              }`}
            >
              <span className="message-text">
                {msg.text === "Typing..." ? (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  renderMessageText(
                    msg,
                    msg.text,
                    msg.sender,
                    debugModes[msg.id] || false
                  )
                )}
              </span>

              {msg.data && <pre>{createDynamicAsciiTable(msg.data)}</pre>}

              {msg.sender === "bot" &&
                msg.text !== "Typing..." &&
                index !== 0 && (
                  <div className="like-unlike-icons">
                    <span
                      role="img"
                      aria-label="unlike"
                      onClick={() =>
                        handleUnlike(
                          msg.id,
                          conversationHistory,
                          IdConversation
                        )
                      }
                      title="Dislike this answer"
                      style={{ cursor: "pointer", marginRight: "8px" }}
                    >
                      👎
                    </span>
                    <span
                      role="img"
                      aria-label="debug"
                      onClick={() => toggleDebugMode(msg.id)}
                      title="Toggle debug mode"
                      style={{ cursor: "pointer", marginRight: "8px" }}
                    >
                      🐞
                    </span>
                    <span
                      role="img"
                      aria-label="copy"
                      onClick={() => copyContent(msg.id)}
                      title="Copy this message"
                      style={{ cursor: "pointer" }}
                    >
                      📄
                    </span>
                  </div>
                )}
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>
      {showScrollButton && (
        <button
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          title="Scroll to bottom"
          style={{ left: buttonPosition }}
        >
          ↓
        </button>
      )}
      <div className="info-message"></div>
    </div>
  )
}

export default MessageList
