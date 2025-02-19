import React from "react"
import "./History.css"

const History = ({ isOpen, onClose, chatbotSelected, idPrompt }) => {
  if (!isOpen) return null

  return (
    <div className="popup-overlay">
      <div className="popup-content history-popup">
        <div className="popup-header">
          <h2>Chat History</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="popup-body">
          {/* Qui andrà la lista delle conversazioni */}
        </div>
      </div>
    </div>
  )
}

export default History
