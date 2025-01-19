// Home.js
import React, { useState } from "react"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import Navbar from "../../components/navbar/Navbar"
import ChatbotSource from "../../components/popups/chatbot-poulin/ChatbotPoulinPopup"
import InvoicePopup from "../../components/popups/invoices/InvoicePopup.js"
import Popup from "../../components/popups/Popup"
import PromptsPopup from "../../components/popups/prompts/PromptsPopup.js"
import UnlikePopup from "../../components/popups/unlike/UnlikePopup.js"
import UploadPopup from "../../components/popups/upload/UploadPopup.js"
import "./Home.css"

const Home = () => {
  const { t } = useTranslation()
  const [activePopup, setActivePopup] = useState(null)

  const closePopup = () => {
    setActivePopup(null)
  }

  const openPopup = (popupType) => {
    setActivePopup(popupType)
  }

  return (
    <div>
      <Helmet>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </Helmet>

      <Navbar />

      <Popup isOpen={activePopup === "chatbotsource"}>
        <ChatbotSource onClose={closePopup} />
      </Popup>

      <Popup isOpen={activePopup === "prompts"}>
        <PromptsPopup onClose={closePopup} />
      </Popup>

      <Popup isOpen={activePopup === "unliked"}>
        <UnlikePopup onClose={closePopup} />
      </Popup>

      <Popup isOpen={activePopup === "upload"}>
        <UploadPopup onClose={closePopup} />
      </Popup>

      <Popup isOpen={activePopup === "invoices"}>
        <InvoicePopup onClose={closePopup} />
      </Popup>

      <div className="home-container">
        <h1 className="ourservice">AI dairy-tools</h1>
        <section className="features">
          <div className="feature-item">
            <div
              className="image-container"
              onClick={() => openPopup("chatbotsource")}
            >
              <img
                src="../images/chatbot.webp"
                alt={t("home.features.chatbot.title")}
                className="feature-image"
              />
              <div className="overlay">
                <h3>Sales Reader chatbot</h3>
                <div className="subtitle"> </div>
              </div>
            </div>
            <div className="actions-chatbot">
              <button className="btn" onClick={() => openPopup("prompts")}>
                <i className="fas fa-cogs"></i>
                <div className="tooltip">Prompts</div>
              </button>

              <button className="btn" onClick={() => openPopup("upload")}>
                <i className="fas fa-upload"></i>
                <div className="tooltip">Upload</div>
              </button>

              <button className="btn" onClick={() => openPopup("unliked")}>
                <i className="fas fa-history"></i>
                <div className="tooltip">Unliked</div>
              </button>
            </div>
          </div>

          <div className="feature-item">
            <div className="image-container">
              <img
                src="../images/chatbot.webp"
                alt={t("home.features.chatbot.title")}
                className="feature-image disabled-image"
                style={{ backgroundColor: "gray" }}
              />
              <div className="overlay">
                <h3>... </h3>
                <div className="subtitle"> </div>
              </div>
            </div>
          </div>

          <div className="feature-item">
            <div className="image-container">
              <img
                src="../images/chatbot.webp"
                alt={t("home.features.chatbot.title")}
                className="feature-image disabled-image"
                style={{ backgroundColor: "gray" }}
              />
              <div className="overlay">
                <h3>... </h3>
                <div className="subtitle"> </div>
              </div>
            </div>
          </div>

          <div className="feature-item">
            <div className="image-container">
              <img
                src="../images/chatbot.webp"
                alt={t("home.features.chatbot.title")}
                className="feature-image disabled-image"
                style={{ backgroundColor: "gray" }}
              />
              <div className="overlay">
                <h3> ...</h3>
                <div className="subtitle"> </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
