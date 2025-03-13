import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { IsExpired } from "../../services/api/auth/isExpireApi"

/**
 * Componente che protegge le rotte che richiedono autenticazione
 * Reindirizza alla pagina di login se l'utente non è autenticato
 * @param {Object} props - Le proprietà del componente
 * @param {React.ReactNode} props.children - I componenti figli da renderizzare se l'utente è autenticato
 * @param {string} props.userId - L'ID dell'utente da verificare
 * @returns {React.ReactNode} I componenti figli o il redirect alla pagina di login
 */
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
    const intervalId = setInterval(checkAuth, 120000) // Esegui checkAuth ogni 2 minuti

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
