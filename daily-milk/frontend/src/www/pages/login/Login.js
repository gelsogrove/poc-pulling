import Cookies from "js-cookie" // Importa la libreria per i cookie
import React, { useState } from "react"
import { useNavigate } from "react-router-dom" // Importa il navigatore
import { login } from "./api/LoginApi" // Importa la funzione di login
import { register } from "./api/RegisterApi" // Importa la funzione di registrazione
import { verifyOtp } from "./api/VerifyOtp" // Importa la funzione di verifica OTP
import "./Login.css"

function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const navigate = useNavigate() // Inizializza il navigatore

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isRegistering) {
      if (password !== confirmPassword) {
        alert("Passwords do not match! Please try again.")
        return
      }

      try {
        await register({ username, password, name, surname })
        setIsRegistered(true)
        setOtpStep(true)
      } catch (error) {
        alert("Registration failed! Please try again.")
      }
    } else {
      try {
        const response = await login(username, password)
        if (response.userId) {
          Cookies.set("username", response.username)
          Cookies.set("userId", response.userId)
          Cookies.set("name", response.name)
          Cookies.set("role", response.role)
          setOtpStep(true)
        }
      } catch (error) {
        alert("Login failed! Please check your credentials.")
      }
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    try {
      const isOtpValid = await verifyOtp(otpCode)
      if (isOtpValid) {
        // CHIAMATA API se e' valido nella tabella utenti aggiungiamo 30 minuti all'expired
        navigate("/home")
      } else {
        alert("Invalid OTP! Please try again.")
      }
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="login-container">
      {!otpStep && (
        <>
          <h2>{isRegistering ? "New User" : "Login"}</h2>
          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <div>
                  <input
                    placeholder="Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    placeholder="Surname"
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <div>
              <input
                placeholder={isRegistering ? "Email" : "Username"}
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isRegistering && (
              <div>
                <input
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <button type="submit">
              {isRegistering ? "Register" : "Login"}
            </button>
          </form>
          <div className="switch-mode">
            <p>
              {isRegistering
                ? "Already have an account? "
                : "Don't have an account? "}
              <span
                className="switch-link"
                onClick={() => {
                  setIsRegistering(!isRegistering)
                  setIsRegistered(false)
                }}
              >
                {isRegistering ? "Login" : "Sign Up"}
              </span>
            </p>
          </div>
        </>
      )}

      {otpStep && (
        <>
          {isRegistered && (
            <>
              <h2>Scan QR Code</h2>
              <p>
                Scan the QR Code with your authentication app (e.g., Google
                Authenticator) to generate OTP codes.
              </p>
              <img
                src="/images/qrcode.png"
                alt="QR Code"
                style={{ width: "200px" }}
              />
            </>
          )}
          <h2>Enter OTP</h2>
          <form onSubmit={handleOtpSubmit}>
            <div>
              <input
                placeholder="Enter OTP"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>
            <button type="submit">Verify OTP</button>
          </form>
        </>
      )}
    </div>
  )
}

export default Login
