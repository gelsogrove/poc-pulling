import Cookies from "js-cookie"
import { useState } from "react"
import "./MessageList.css"

export const createDynamicAsciiTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available"
  }

  // Get headers as column names
  const headers = Object.keys(data[0])

  // Function to format numbers in Italian style without decimals
  const formatNumber = (value) => {
    if (!isNaN(value) && value !== null && value !== "") {
      return parseInt(value, 10).toLocaleString("it-IT")
    }
    return value
  }

  // Find the maximum width for each column
  const columnWidths = headers.map((header) =>
    Math.max(
      header.length,
      ...data.map((row) => String(formatNumber(row[header]) || "").length)
    )
  )

  // Function to create a formatted row
  const createRow = (row) =>
    "| " +
    headers
      .map((header, i) =>
        String(formatNumber(row[header]) || "").padEnd(columnWidths[i])
      )
      .join(" | ") +
    " |"

  // Generate header row
  const headerRow = createRow(Object.fromEntries(headers.map((h) => [h, h])))
  const separatorRow =
    "+-" + columnWidths.map((width) => "-".repeat(width)).join("-+-") + "-+"

  // Generate data rows
  const dataRows = data.map((row) => createRow(row))

  // Combine all parts to create the table
  const table = [
    separatorRow,
    headerRow,
    separatorRow,
    ...dataRows,
    separatorRow,
  ].join("\n")

  return table
}

const MessageList = ({ IdConversation, conversationHistory, messages }) => {
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

  function getCurrentDateTime() {
    const now = new Date()

    // Ottieni l'anno, il mese e il giorno
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0") // Mesi da 0 a 11, quindi aggiungi 1
    const day = String(now.getDate()).padStart(2, "0")

    // Ottieni ore e minuti
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")

    // Combina tutto in un'unica stringa
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

        // Disabilita tutte le icone unlike
        const unlikeIcons = document.querySelectorAll(".like-unlike-icons span")
        unlikeIcons.forEach((icon) => {
          icon.style.color = "gray" // Cambia colore
          icon.style.pointerEvents = "none" // Disabilita clic
          icon.setAttribute("disabled", "true") // Aggiunge un attributo disabled
        })
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
              {renderMessageText(
                msg,
                msg.text,
                msg.sender,
                debugModes[msg.id] || false
              )}
            </span>

            {/* Display data if available */}
            {msg.data && (
              <pre>{createDynamicAsciiTable(msg.data)}</pre> // Directly use data as array of objects
            )}

            {msg.sender === "bot" &&
              msg.text !== "Typing..." &&
              index !== 0 && (
                <div className="like-unlike-icons">
                  <span
                    role="img"
                    aria-label="unlike"
                    onClick={() =>
                      handleUnlike(msg.id, conversationHistory, IdConversation)
                    }
                    title="Dislike this message"
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
    </div>
  )
}

export default MessageList
