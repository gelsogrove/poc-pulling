/* eslint-disable react-hooks/exhaustive-deps */
// Home.js
import React, { useEffect, useState } from "react"
import { Helmet } from "react-helmet"
import { useTranslation } from "react-i18next"
import { FaHistory } from "react-icons/fa"
import Navbar from "../../components/navbar/Navbar"
import ChatbotSource from "../../components/popups/chatbots/ChatbotPopup.js"
import HistoryPopup from "../../components/popups/history/HistoryPopup.js"
import InvoicePopup from "../../components/popups/invoices/InvoicePopup.js"
import Popup from "../../components/popups/Popup"
import { getPrompts } from "../../components/popups/promptmanager/api/promptmanager_api"
import PromptsPopup from "../../components/popups/prompts/PromptsPopup.js"
import UnlikePopup from "../../components/popups/unlike/UnlikePopup.js"
import UploadPopup from "../../components/popups/upload/UploadPopup.js"

import "./Home.css"

// eslint-disable-next-line no-unused-vars
const API_URL =
  process.env.REACT_APP_API_URL || "https://poulin-bd075425a92c.herokuapp.com"

const Home = () => {
  const { t } = useTranslation()
  const [activePopup, setActivePopup] = useState(null)
  const [chatbot, setChatbot] = useState("poulin/sales-reader")
  const [title, setTitle] = useState("")
  const [prompts, setPrompts] = useState([])
  const [idPrompt, setIdPrompt] = useState()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

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

  const openHistory = () => setIsHistoryOpen(true)
  const closeHistory = () => setIsHistoryOpen(false)

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

      <HistoryPopup
        isOpen={isHistoryOpen}
        onClose={closeHistory}
        chatbotSelected={chatbot}
        idPrompt={idPrompt}
      />

      <div className="home-container">
        <section className="features">
          {/* Prima riga: solo Main chatbot */}
          <div className="features-row main-row">
            {prompts
              .filter(
                (prompt) => prompt.promptname === "Main" && !prompt.ishide
              )
              .map((prompt) => (
                <div
                  key={prompt.idprompt}
                  className="feature-item main-feature"
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
                      src={prompt.image}
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
                      <i className="fas fa-thumbs-down"></i>
                      <div className="tooltip">Unliked</div>
                    </button>

                    <button
                      onClick={openHistory}
                      className="btn"
                      title="View Chat History"
                    >
                      <FaHistory style={{ fontSize: "30px" }} />
                      <div className="tooltip">History</div>
                    </button>

                    <button className="btn">
                      <i
                        className="fab fa-whatsapp"
                        style={{ fontSize: "30px" }}
                      ></i>
                      <div className="tooltip">WhatsApp Settings</div>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Seconda riga: altri chatbot */}
          <div className="features-row secondary-row">
            {prompts
              .filter(
                (prompt) => prompt.promptname !== "Main" && !prompt.ishide
              )
              .map((prompt) => (
                <div key={prompt.idprompt} className="feature-item">
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
                      src={prompt.image}
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
                      <i className="fas fa-thumbs-down"></i>
                      <div className="tooltip">Unliked</div>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
