import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import "./App.css"
import ProtectedRoute from "./ProtectedRoute"
import Home from "./www/pages/home/Home"
import Login from "./www/pages/login/Login"

const App = () => {
  return (
    <div className="app-container">
      <div className="main-content">
        <Routes>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
