/* eslint-disable react-hooks/exhaustive-deps */
// Home.js
import axios from "axios"
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

import "./Home.css"

// Definiamo API_URL all'inizio del file
const API_URL =
  process.env.REACT_APP_API_URL || "https://poulin-bd075425a92c.herokuapp.com"

const Home = () => {
  const { t } = useTranslation()
  const [activePopup, setActivePopup] = useState(null)
  const [chatbot, setChatbot] = useState("poulin/sales-reader")
  const [title, setTitle] = useState("")
  const [prompts, setPrompts] = useState([])
  const [idPrompt, setIdPrompt] = useState()
  const [chatbotImage, setChatbotImage] = useState("/images/chatbot.webp")

  useEffect(() => {
    fetchPrompts()
  }, [])

  useEffect(() => {
    const fetchPromptDetails = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/prompts?idPrompt=${idPrompt}`
        )
        const { image } = response.data.content
        setChatbotImage(image || "/images/chatbot.webp")
      } catch (error) {
        console.error("Error fetching prompt details:", error)
      }
    }

    if (idPrompt) {
      fetchPromptDetails()
    }
  }, [idPrompt])

  const fetchPrompts = async () => {
    try {
      const data = await getPrompts()
      setPrompts(data)
    } catch (err) {
      console.error("Error fetching prompts:", err)
    }
  }

  const closePopup = () => {
    if (activePopup !== "chatbotsource") {
      window.location.reload()
    }

    setActivePopup(null)
  }

  const openPopup = async (popupType, chatbot, title, promptId) => {
    setActivePopup(popupType)
    setChatbot(chatbot)
    setTitle(title)
    setIdPrompt(promptId)
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
          idPrompt={idPrompt}
          onClose={closePopup}
        />
      </Popup>

      <Popup isOpen={activePopup === "prompts"}>
        <PromptsPopup
          chatbotSelected={chatbot}
          idPrompt={idPrompt}
          onClose={closePopup}
        />
      </Popup>

      <Popup isOpen={activePopup === "unliked"}>
        <UnlikePopup
          chatbotSelected={chatbot}
          idPrompt={idPrompt}
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
                      `${prompt.promptname}`,
                      prompt.idprompt
                    )
                  }
                >
                  <img
                    src={chatbotImage}
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
                        `${prompt.promptname} chatbot`,
                        prompt.idprompt
                      )
                    }
                  >
                    <i className="fas fa-cogs"></i>
                    <div className="tooltip">Prompts</div>
                  </button>

                  <button
                    className={`btn`}
                    onClick={() =>
                      openPopup(
                        "unliked",
                        "poulin/" + prompt.path,
                        `${prompt.promptname}`,
                        prompt.idprompt
                      )
                    }
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
