import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import i18n from "../../../i18n"
import InvoicePopup from "../../components/popups/invoices/InvoicePopup.js"
import Popup from "../../components/popups/Popup"
import { LogOut } from "./api/LogoutApi"
import "./Navbar.css"

const Navbar = () => {
  const navigate = useNavigate()

  const [activePopup, setActivePopup] = useState(null)
  const closePopup = () => {
    setActivePopup(null)
  }

  const openPopup = (popupType) => {
    setActivePopup(popupType)
  }

  useEffect(() => {
    const supportedLanguages = ["it", "es", "en"]
    let language = "en"

    if (!language) {
      const browserLanguage = navigator.language.split("-")[0]
      language = supportedLanguages.includes(browserLanguage)
        ? browserLanguage
        : "en"
    }

    i18n.changeLanguage(language)
  }, [])

  const clearAllCookies = () => {
    LogOut()

    setTimeout(() => {
      //clear all
      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim()
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
      })

      navigate("/login")
    }, 500)
  }

  return (
    <div>
      <Popup isOpen={activePopup === "invoices"}>
        <InvoicePopup onClose={closePopup} />
      </Popup>

      <nav className="navbar">
        <button className="btn" onClick={() => openPopup("invoices")}>
          <i className="fas fa-file-invoice"></i>
          <div className="tooltip">Invoices</div>
        </button>

        <button onClick={clearAllCookies} className="btn logout-btn">
          <i className="fa-solid fa-right-from-bracket"></i>
          <div className="tooltip">Logout</div>
        </button>
      </nav>
    </div>
  )
}

export default Navbar
