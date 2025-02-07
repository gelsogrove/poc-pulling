import React, { useState } from "react"
import ChatBotComponent from "../../chatbots/ChatbotComponent"
import "./ChatbotPopup.css"
import PrintSection from "./PrintSection"

const ChatbotPopup = ({ idPrompt, onClose, chatbotSelected, title }) => {
  const [openPanel, setOpenPanel] = useState(false)

  const onTogglePanel = () => {
    setOpenPanel((prev) => !prev)
  }

  return (
    <div>
      <div className="chatbot-popup">
        <div className="buttons-container">
          <button
            className="btn-circle"
            onClick={onTogglePanel}
            title="Toggle panel"
          >
            {openPanel ? (
              <i className="fa-solid fa-arrow-right icon"></i>
            ) : (
              <i className="fa-solid fa-arrow-left icon"></i>
            )}
          </button>

          <button className="btn-circle" onClick={PrintSection} title="Print">
            <i className="fa-solid fa-print icon"></i>
          </button>

          <button className="btn-circle" onClick={onClose} title="Close">
            <i className="fa-solid fa-close icon"></i>
          </button>
        </div>

        <div className="chat-section-source">
          <h3 className="chatbot-title">{title}</h3>
          <ChatBotComponent
            chatbotSelected={chatbotSelected}
            idPrompt={idPrompt}
            openPanel={openPanel}
          />
        </div>
      </div>
    </div>
  )
}

export default ChatbotPopup
