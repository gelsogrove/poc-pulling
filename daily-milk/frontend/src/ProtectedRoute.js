import React, { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "./AuthContext"

// ProtectedRoute.js
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext)

  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated) // Debug

  if (isLoading) {
    return <div>Loading...</div> // Mostra un loader finché il caricamento non è completato
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
