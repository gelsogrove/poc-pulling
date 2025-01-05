import React, { useState } from "react"
import ChatPoulin from "../../chatbots/chat-poulin/ChatPoulin"
import "./ChatbotPoulinPopup.css"

const ChatbotPoulinPopup = ({ onClose }) => {
  const [openPanel, setOpenPanel] = useState(false) // Usa useState per gestire lo stato del pannello

  const onTogglePanel = () => {
    setOpenPanel((prev) => !prev) // Cambia lo stato del pannello
  }

  return (
    <div>
      <div className="chatbot-popup-poulin">
        <button
          className="visible-panel btn hover-effect"
          onClick={onTogglePanel}
        >
          {openPanel ? (
            <i class="fa-solid fa-arrow-right icon"></i>
          ) : (
            <i class="fa-solid fa-arrow-left icon"></i>
          )}
        </button>

        <button onClick={onClose} className="close-popup btn hover-effect">
          <i class="fa-solid fa-close icon"></i>
        </button>

        {/* Sezione Chat */}
        <div className="chat-section-source">
          <h3>Sales reader chatbot</h3>
          <ChatPoulin openPanel={openPanel} />
        </div>
      </div>
    </div>
  )
}

export default ChatbotPoulinPopup
