import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import "./App.css"
import ProtectedRoute from "./components/shared/ProtectedRoute"
import Home from "./pages/home/Home"
import Login from "./pages/login/Login"

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
