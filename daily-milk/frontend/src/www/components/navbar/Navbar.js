import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "./api/LogoutApi"
import i18n from "../../../i18n"
import "./Navbar.css"

const Navbar = () => {
  const navigate = useNavigate()

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
    <nav className="navbar">
      <button onClick={clearAllCookies} className="btn logout-btn">
        <i className="fa-solid fa-right-from-bracket"></i>
        <div className="tooltip">Logout</div>
      </button>
    </nav>
  )
}

export default Navbar
