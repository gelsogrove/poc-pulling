import React, { useEffect, useRef, useState } from "react"
import { createDynamicAsciiTable } from "../../shared/utils"
import { handleUnlikeApi } from "./api/MessageList_api"
import "./MessageList.css"

const MessageList = ({
  idPrompt,
  IdConversation,
  conversationHistory,
  messages,
  refresh,
  openPanel,
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

  useEffect(() => {
    setTimeout(scrollToBottom, 0)
  }, [messages])

  useEffect(() => {
    setShowScrollButton(messages.length > 8)
  }, [messages])

  const handleUnlike = async (msgId, conversationHistory, IdConversation) => {
    try {
      const response = await handleUnlikeApi(
        msgId,
        conversationHistory,
        IdConversation,
        idPrompt
      )
      if (response) {
        const unlikeIcon = document.querySelector(
          `[data-id='${msgId}'] .unlike-icon`
        )

        if (!unlikeIcon) {
          console.error(`Icon with data-id='${msgId}' not found!`)
          return
        }

        unlikeIcon.classList.toggle("selected")
        console.log(unlikeIcon)
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
            <>
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
                    <>
                      <div className="like-unlike-icons" data-id={msg.id}>
                        <span
                          role="img"
                          aria-label="unlike"
                          className="unlike-icon"
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
