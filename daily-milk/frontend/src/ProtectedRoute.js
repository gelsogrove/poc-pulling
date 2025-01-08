import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { IsExpired } from "./www/pages/login/api/isExpireApi"

// ProtectedRoute.js
const ProtectedRoute = ({ children, userId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null) // Stato per autenticazione
  const [loading, setLoading] = useState(true) // Stato di caricamento

  useEffect(() => {
    const checkAuth = async () => {
      const response = await IsExpired(userId)
      setIsAuthenticated(!response)
      setLoading(false) // Imposta loading a false dopo il controllo
    }

    checkAuth()
    const intervalId = setInterval(checkAuth, 120000) // Esegui checkAuth ogni min

    return () => clearInterval(intervalId) // Pulisci l'intervallo al dismount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (loading) {
    return <div></div> // Mostra un messaggio di caricamento
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
