import React, { useState } from "react"
import ChatPoulin from "../../chatbots/chat-poulin/ChatPoulin"
import "./ChatbotPoulinPopup.css"
import PrintSection from "./PrintSection"

const ChatbotPoulinPopup = ({ onClose }) => {
  const [openPanel, setOpenPanel] = useState(false)

  const onTogglePanel = () => {
    setOpenPanel((prev) => !prev)
  }

  return (
    <div>
      <div className="chatbot-popup-poulin">
        <button
          className="visible-panel btn hover-effect"
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
          <ChatPoulin openPanel={openPanel} />
        </div>
      </div>
    </div>
  )
}

export default ChatbotPoulinPopup
