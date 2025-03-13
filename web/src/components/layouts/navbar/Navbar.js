import Cookies from "js-cookie"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "../../../services/api/auth/Logout_api.js"
import i18n from "../../../utils/i18n"
import InvoicePopup from "../../features/modals/invoices/InvoicePopup.js"
import Popup from "../../features/modals/Popup"
import SettingsPopup from "../../features/modals/settings/SettingsPopup.js"
import UserManager from "../../features/modals/usermanager/Usermanager.js"
import "./Navbar.css"

import {
  downloadBackup,
  uploadBackup,
} from "../../../services/api/auth/Backup_api.js"
import ModelsPopup from "../../features/modals/models/ModelsPopup.js"
import PromptManager from "../../features/modals/promptmanager/PromptManager"
import RolesPopup from "../../features/modals/roles/RolesPopup"

const handleBackup = async () => {
  const success = await downloadBackup()
  if (!success) {
    alert("Failed to download the backup. Please try again.")
  }
}

// eslint-disable-next-line no-unused-vars
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

  const [showRolesPopup, setShowRolesPopup] = useState(false)
  const [userRole, setUserRole] = useState("")

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

    const role = Cookies.get("role")
    setUserRole(role || "")
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

  const handleRolesClick = () => {
    setShowRolesPopup(true)
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

      <Popup isOpen={activePopup === "prompts"}>
        <PromptManager onClose={closePopup} />
      </Popup>

      <Popup isOpen={showRolesPopup}>
        <RolesPopup onClose={() => setShowRolesPopup(false)} />
      </Popup>

      <nav className="navbar">
        <button className="btn" onClick={() => openPopup("models")}>
          <i className="fas fa-robot"></i>
          <div className="tooltip">Models</div>
        </button>

        {userRole?.toLowerCase() === "admin" && (
          <button className="btn" onClick={() => openPopup("prompts")}>
            <i className="fas fa-message"></i>
            <div className="tooltip">Prompts</div>
          </button>
        )}

        <button className="btn" onClick={() => openPopup("invoices")}>
          <i className="fas fa-file-invoice"></i>
          <div className="tooltip">Invoices</div>
        </button>

        <button className="btn" onClick={() => openPopup("manageUsers")}>
          <i className="fas fa-users"></i>
          <div className="tooltip">Manage Users</div>
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
