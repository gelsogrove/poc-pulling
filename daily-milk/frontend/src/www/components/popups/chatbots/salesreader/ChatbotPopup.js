import React, { useState } from "react"
import ChatBotComponent from "../../../chatbots/salesreader/ChatbotComponent"
import "./ChatbotPopup.css"
import PrintSection from "./PrintSection"

const ChatbotPopup = ({ idPrompt, onClose }) => {
  const [openPanel, setOpenPanel] = useState(false)

  const onTogglePanel = () => {
    setOpenPanel((prev) => !prev)
  }

  return (
    <div>
      <div className="chatbot-popup">
        <button
          className="visible-panel btn hover-effect openclose "
          onClick={onTogglePanel}
        >
          {openPanel ? (
            <i className="fa-solid fa-arrow-right icon"></i>
          ) : (
            <i className="fa-solid fa-arrow-left icon"></i>
          )}
        </button>

        <button onClick={onClose} className="close-popup btn hover-effect">
          <i className="fa-solid fa-close icon"></i>
        </button>

        <PrintSection />

        <div className="chat-section-source">
          <h3>Sales reader chatbot</h3>
          <ChatBotComponent idPrompt={idPrompt} openPanel={openPanel} />
        </div>
      </div>
    </div>
  )
}

export default ChatbotPopup
