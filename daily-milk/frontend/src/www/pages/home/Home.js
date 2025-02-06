/* eslint-disable react-hooks/exhaustive-deps */
// Home.js
import Cookies from "js-cookie"
import React, { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import Navbar from "../../components/navbar/Navbar"
import ChatbotSource from "../../components/popups/chatbots/salesreader/ChatbotPopup.js"
import InvoicePopup from "../../components/popups/invoices/InvoicePopup.js"
import Popup from "../../components/popups/Popup"
import PromptsPopup from "../../components/popups/prompts/salesreader/PromptsPopup.js"
import UnlikePopup from "../../components/popups/unlike/UnlikePopup.js"
import UploadPopup from "../../components/popups/upload/UploadPopup.js"
import { PROMPT_ID } from "../../config/constants"
import { checkUnlikeExists, getPromptName } from "./api/home_api"
import "./Home.css"

const Home = () => {
  const { t } = useTranslation()
  const [activePopup, setActivePopup] = useState(null)
  const [chatbot, setChatbot] = useState("poulin/sales-reader")
  const [promptName, setPromptName] = useState("poulin/sales-reader")
  const [hasUnlikes, setHasUnlikes] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("token")
        const [name, unlikeExists] = await Promise.all([
          getPromptName(PROMPT_ID, token, chatbot),
          checkUnlikeExists(PROMPT_ID, token, chatbot),
        ])

        if (name) {
          setPromptName(name)
        }
        setHasUnlikes(unlikeExists)
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error)
      }
    }

    fetchData()
  }, [])

  const closePopup = () => {
    setActivePopup(null)
    window.location.reload()
  }

  const openPopup = (popupType, chatbot) => {
    setActivePopup(popupType)
    setChatbot(chatbot)
  }

  const refreshPromptName = async () => {
    try {
      const token = Cookies.get("token")
      const name = await getPromptName(PROMPT_ID, token, chatbot)
      if (name) {
        setPromptName(name)
      }
    } catch (error) {
      console.error("Errore durante il recupero del nome del prompt:", error)
    }
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
        <ChatbotSource
          chatbotSelected={chatbot}
          idPrompt={PROMPT_ID}
          onClose={closePopup}
        />
      </Popup>

      <Popup isOpen={activePopup === "prompts"}>
        <PromptsPopup
          chatbotSelected={chatbot}
          idPrompt={PROMPT_ID}
          onClose={closePopup}
          onSave={refreshPromptName}
        />
      </Popup>

      <Popup isOpen={activePopup === "unliked"}>
        <UnlikePopup
          chatbotSelected={chatbot}
          idPrompt={PROMPT_ID}
          onClose={closePopup}
        />
      </Popup>

      <Popup isOpen={activePopup === "upload"}>
        <UploadPopup onClose={closePopup} />
      </Popup>

      <Popup isOpen={activePopup === "invoices"}>
        <InvoicePopup chatbotSelected={chatbot} onClose={closePopup} />
      </Popup>

      <div className="home-container">
        <h1 className="ourservice">AI dairy-tools</h1>
        <img alt="" className="logo" src="/images/whatsapp.jpg" />
        <div className="num">+001 646474747</div>
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
                <h3>{promptName}</h3>
                <div className="subtitle"> </div>
              </div>
            </div>
            <div className="actions-chatbot">
              <button
                className="btn"
                onClick={() => openPopup("prompts", "poulin/sales-reader")}
              >
                <i className="fas fa-cogs"></i>
                <div className="tooltip">Prompts</div>
              </button>

              <button
                className="btn"
                onClick={() => openPopup("upload", "poulin/sales-reader")}
              >
                <i className="fas fa-upload"></i>
                <div className="tooltip">Upload</div>
              </button>

              <button
                className={`btn ${!hasUnlikes ? "disabled-btn" : ""}`}
                onClick={() =>
                  hasUnlikes && openPopup("unliked", "poulin/sales-reader")
                }
                disabled={!hasUnlikes}
              >
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
