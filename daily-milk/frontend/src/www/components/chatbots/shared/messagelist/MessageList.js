import React, { useState } from "react"
import "./MessageList.css"

export const createDynamicAsciiTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available"
  }

  // Ottieni le chiavi come intestazioni
  const headers = Object.keys(data[0])

  // Funzione per formattare i numeri nello stile italiano senza decimali
  const formatNumber = (value) => {
    if (!isNaN(value) && value !== null && value !== "") {
      return parseInt(value, 10).toLocaleString("it-IT")
    }
    return value
  }

  // Trova la larghezza massima per ogni colonna
  const columnWidths = headers.map((header) =>
    Math.max(
      header.length,
      ...data.map((row) => String(formatNumber(row[header]) || "").length)
    )
  )

  // Funzione per creare una riga formattata
  const createRow = (row) =>
    "| " +
    headers
      .map((header, i) =>
        String(formatNumber(row[header]) || "").padEnd(columnWidths[i])
      )
      .join(" | ") +
    " |"

  // Genera l'intestazione
  const headerRow = createRow(Object.fromEntries(headers.map((h) => [h, h])))
  const separatorRow =
    "+-" + columnWidths.map((width) => "-".repeat(width)).join("-+-") + "-+"

  // Genera le righe dei dati
  const dataRows = data.map((row) => createRow(row))

  // Combina tutte le parti per creare la tabella
  const table = [
    separatorRow,
    headerRow,
    separatorRow,
    ...dataRows,
    separatorRow,
  ].join("\n")

  return table
}

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
          return <span>{text}</span>
        }
      } catch (error) {
        console.log(
          `Errore nel parsing JSON per il messaggio ${msg.id}:`,
          error
        )
        return debugMode ? (
          <pre>{JSON.stringify(msg, null, 2)}</pre>
        ) : (
          <div style={{ whiteSpace: "pre-line" }}>{text}</div>
        )
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
            {msg.data && (
              <pre>{createDynamicAsciiTable(msg.data)}</pre> // Usa direttamente i dati come array di oggetti
            )}

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
