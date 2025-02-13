/* eslint-disable react-hooks/exhaustive-deps */
// Home.js
import Cookies from "js-cookie"
import React, { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import Navbar from "../../components/navbar/Navbar"
import ChatbotSource from "../../components/popups/chatbots/ChatbotPopup.js"
import InvoicePopup from "../../components/popups/invoices/InvoicePopup.js"
import Popup from "../../components/popups/Popup"
import { getPrompts } from "../../components/popups/promptmanager/api/promptmanager_api"
import PromptsPopup from "../../components/popups/prompts/PromptsPopup.js"
import UnlikePopup from "../../components/popups/unlike/UnlikePopup.js"
import UploadPopup from "../../components/popups/upload/UploadPopup.js"

import { checkUnlikeExists } from "./api/home_api"
import "./Home.css"

export const PROMPT_ID = "a2c502db-9425-4c66-9d92-acd3521b38b5"

const Home = () => {
  const { t } = useTranslation()
  const [activePopup, setActivePopup] = useState(null)
  const [chatbot, setChatbot] = useState("poulin/sales-reader")
  const [hasUnlikes, setHasUnlikes] = useState(false)
  const [title, setTitle] = useState("")
  const [prompts, setPrompts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("token")
        const unlikeExists = await checkUnlikeExists(PROMPT_ID, token, chatbot)
        setHasUnlikes(unlikeExists)
      } catch (error) {
        console.error("Errore durante il recupero dei dati:", error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const data = await getPrompts()
      setPrompts(data)
    } catch (err) {
      console.error("Error fetching prompts:", err)
    }
  }

  const closePopup = () => {
    if (activePopup === "prompts") {
      window.location.reload()
    }
    setActivePopup(null)
  }

  const openPopup = (popupType, chatbot, title) => {
    setActivePopup(popupType)
    setChatbot(chatbot)
    setTitle(title)
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
          title={title}
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
        <h1 className="ourservice">AI dairy-tools </h1>
        <img alt="" className="logo" src="/images/whatsapp.jpg" />
        <div className="num">+001 646474747</div>
        <section className="features">
          {prompts
            .filter((prompt) => !prompt.ishide)
            .map((prompt) => (
              <div
                key={prompt.idprompt}
                className={`feature-item ${
                  !prompt.isactive ? "disabled-image" : ""
                }`}
              >
                <div
                  className="image-container"
                  onClick={() =>
                    openPopup(
                      "chatbotsource",
                      "poulin/" + prompt.path,
                      `${prompt.promptname}`
                    )
                  }
                >
                  <img
                    src="../images/chatbot.webp"
                    alt={t("home.features.chatbot.title")}
                    className="feature-image"
                  />
                  <div className="overlay">
                    <h3>{prompt.promptname}</h3>
                    <div className="subtitle"> </div>
                  </div>
                </div>
                <div className="actions-chatbot">
                  <button
                    className="btn"
                    onClick={() =>
                      openPopup(
                        "prompts",
                        "poulin/" + prompt.path,
                        `${prompt.promptname} chatbot`
                      )
                    }
                  >
                    <i className="fas fa-cogs"></i>
                    <div className="tooltip">Prompts</div>
                  </button>

                  <button
                    className={`btn ${!hasUnlikes ? "disabled-btn" : ""}`}
                    onClick={() =>
                      hasUnlikes &&
                      openPopup(
                        "unliked",
                        prompt.promptname,
                        `${prompt.promptname}`
                      )
                    }
                    disabled={!hasUnlikes}
                  >
                    <i className="fas fa-history"></i>
                    <div className="tooltip">Unliked</div>
                  </button>
                </div>
              </div>
            ))}
        </section>
      </div>
    </div>
  )
}

export default Home
