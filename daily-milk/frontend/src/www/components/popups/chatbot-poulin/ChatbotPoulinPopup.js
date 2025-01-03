import React, { useState } from "react"
import ChatPoulin from "../../chatbots/chat-poulin/ChatPoulin"
import "./ChatbotPoulinPopup.css"

const ChatbotPoulinPopup = ({ onClose }) => {
  const [openPanel, setOpenPanel] = useState(false) // Usa useState per gestire lo stato del pannello

  const onTogglePanel = () => {
    setOpenPanel((prev) => !prev) // Cambia lo stato del pannello
  }

  // Crea l'oggetto config
  const config = {
    title: "Generative AI ChatBot",
    filename: "./source/data.json",
    systemPrompt: `


    `,
    first_message: "Hello, how can I help you today?",
    first_options: [
      "I want to see the top Clients",
      "I want to see the top Products",
      "I want to see the top Sellers",
      "Provide me the statistics of the month",
      "Other",
      "Exit",
    ],
    error_message:
      "There was an error processing your request. Please try again.",
    goodbye_message: "Thank you. Goodbye!",
    max_tokens: 3500,
    temperature: 0.7,
    model: "gpt-4o-mini",
    ispay: true,
    server: "https://human-in-the-loops-688b23930fa9.herokuapp.com",
    local: "http://localhost:4999",
  }

  console.log(config)

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
