import React, { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createDynamicAsciiTable } from "../../shared/utils"
import "./MessageList.css"

const MessageList = ({
  idPrompt,
  IdConversation,
  conversationHistory,
  messages,
  refresh,
  openPanel,
  model,
  temperature,
  chatbotSelected,
}) => {
  const [debugModes, setDebugModes] = useState({})
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [buttonPosition] = useState("50%")
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

  const renderMessageText = (msg) => {
    if (debugModes[msg.id] || false) {
      return (
        <div>
          <div>{msg.text}</div>
          <div className="debug-mode">
            <pre>{JSON.stringify(msg.debugInfo, null, 2)}</pre>
          </div>
        </div>
      )
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({ node, children, ...props }) => (
            <h3 style={{ margin: "0px" }} {...props}>
              {children}
            </h3>
          ),
          p: ({ node, ...props }) => (
            <p
              style={{
                margin: "0px",
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                margin: "0px",
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li style={{ margin: "0", padding: "0" }} {...props} />
          ),
        }}
      >
        {msg.text}
      </ReactMarkdown>
    )
  }

  useEffect(() => {
    setTimeout(scrollToBottom, 0)
    setShowScrollButton(messages.length > 8)
  }, [messages])

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages
          .filter((msg) => msg.sender !== "system")
          .map((msg, index) => (
            <>
              <div
                data-id={msg.id}
                key={msg.id}
                className={`chat-message ${
                  msg.sender === "bot" ? "bot-message" : "user-message"
                }`}
                style={{ marginRight: "10px" }}
              >
                <span className="message-text">
                  {msg.text === "Typing..." ? (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    renderMessageText(msg)
                  )}
                </span>

                {msg.data && <pre>{createDynamicAsciiTable(msg.data)}</pre>}

                {msg.sender === "bot" &&
                  msg.text !== "Typing..." &&
                  index !== 0 && (
                    <>
                      <div className="like-unlike-icons" data-id={msg.id}>
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
                    </>
                  )}
              </div>

              <hr className="message-divider" />
            </>
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
