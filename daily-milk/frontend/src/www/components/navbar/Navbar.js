import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import i18n from "../../../i18n"
import InvoicePopup from "../../components/popups/invoices/InvoicePopup.js"
import Popup from "../../components/popups/Popup"
import SettingsPopup from "../../components/popups/settings/SettingsPopup.js"
import UserManager from "../../components/popups/usermanager/Usermanager.js"
import { LogOut } from "./api/Logout_api.js"
import "./Navbar.css"

import ModelsPopup from "../../components/popups/models/ModelsPopup.js"
import { downloadBackup, uploadBackup } from "./api/Backup_api.js"

const handleBackup = async () => {
  const success = await downloadBackup()
  if (!success) {
    alert("Failed to download the backup. Please try again.")
  }
}

const handleImport = async () => {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".zip"
  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const success = await uploadBackup(file)
    if (success) {
      alert("Backup imported successfully.")
    } else {
      alert("Failed to import the backup. Please try again.")
    }
  }
  input.click()
}

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
      // Clear all cookies
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

      <Popup isOpen={activePopup === "manageUsers"}>
        <UserManager onClose={closePopup}></UserManager>
      </Popup>

      <Popup isOpen={activePopup === "settings"}>
        <SettingsPopup onClose={closePopup} />
      </Popup>

      <Popup isOpen={activePopup === "models"}>
        <ModelsPopup onClose={closePopup} />
      </Popup>

      <nav className="navbar">
        {/* Pulsante per la lista di chatbots */}
        <button className="btn" onClick={() => openPopup("models")}>
          <i className="fas fa-robot"></i>
          <div className="tooltip">Models</div>
        </button>

        {/* Pulsante per le fatture */}
        <button className="btn" onClick={() => openPopup("invoices")}>
          <i className="fas fa-file-invoice"></i>
          <div className="tooltip">Invoices</div>
        </button>
        {/* Pulsante per il backup */}
        <button className="btn" onClick={handleBackup}>
          <i className="fas fa-download"></i>
          <div className="tooltip">Export</div>
        </button>
        {/* Pulsante per l'import */}
        <button className="btn" onClick={handleImport}>
          <i className="fas fa-upload"></i>
          <div className="tooltip">Import</div>
        </button>

        <button className="btn" onClick={() => openPopup("manageUsers")}>
          <i className="fas fa-users"></i>
          <div className="tooltip">Manage Users</div>
        </button>

        {/* Pulsante per le impostazioni */}
        <button className="btn" onClick={() => openPopup("settings")}>
          <i className="fas fa-cog"></i>
          <div className="tooltip">Settings</div>
        </button>

        {/* Pulsante per il logout */}
        <button onClick={clearAllCookies} className="btn logout-btn">
          <i className="fa-solid fa-right-from-bracket"></i>
          <div className="tooltip">Logout</div>
        </button>
        {/* Pulsante per gestire gli utenti */}
      </nav>
    </div>
  )
}

export default Navbar
