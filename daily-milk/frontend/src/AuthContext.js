import React, { createContext, useEffect, useState } from "react"
import "./App.css"

// AuthContext.js
export const AuthContext = createContext()

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tempAuthenticated, setTempAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simula il controllo del cookie o token
    const authToken = document.cookie.includes("authToken=true")
    console.log("Auth Token:", authToken) // Debug
    setIsAuthenticated(authToken)
    setIsLoading(false) // Fine del caricamento
  }, [])

  const handleLogin = (username, password) => {
    if (username.toLowerCase() === "poulin@tin.it" && password === "wip") {
      setTempAuthenticated(true)
      return true
    } else {
      alert("Invalid username or password. Please try again.")
      setTempAuthenticated(false)
      return false
    }
  }

  const handleRegister = ({ username, password, name, surname }) => {
    console.log("User registered successfully:", {
      username,
      password,
      name,
      surname,
    })
    setTempAuthenticated(true)
  }

  const handleOtpVerify = (otpCode) => {
    if (!/^\d{6}$/.test(otpCode)) {
      alert("Invalid OTP format. Please enter a 6-digit numeric code.")
      return false
    }

    if (tempAuthenticated && otpCode === "555555") {
      setIsAuthenticated(true)
      const expires = new Date(Date.now() + 30 * 60 * 1000).toUTCString() // Scadenza tra 30 minuti
      document.cookie = "authToken=true; path=/; expires=" + expires // Imposta il cookie per 30 minuti
      return true
    } else {
      alert("Invalid OTP. Please try again.")
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        tempAuthenticated,
        isLoading,
        handleLogin,
        handleRegister,
        handleOtpVerify,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
