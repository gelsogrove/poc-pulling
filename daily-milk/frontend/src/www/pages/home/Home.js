// Home.js
import React, { useState } from "react"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import ChatbotSource from "../../components/popups/chatbot-poulin/ChatbotPoulinPopup"
import Popup from "../../components/popups/Popup"
import PromptsPopup from "../../components/popups/Prompts/promptsPopup"
import UnlikePopup from "../../components/popups/Unlike/unlikePopup.js"
import UploadPopup from "../../components/popups/Upload/uploadPopup"
import "./Home.css"

const clearAllCookies = () => {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  })
  window.location.href = "/login"
}

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

      <div className="home-container">
        <h1 className="ourservice">Poulin Grain</h1>
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
                <h3>Sales Reader</h3>
                <div className="subtitle"> </div>
              </div>
            </div>
            <div className="actions">
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

              <button className="btn" onClick={() => openPopup("invoices")}>
                <i class="fas fa-file-invoice"></i>
                <div className="tooltip">Invoices</div>
              </button>

              <button onClick={clearAllCookies} className="btn logout-btn">
                <i className="fa-solid fa-right-from-bracket"></i>
                <div className="tooltip">Logout</div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
