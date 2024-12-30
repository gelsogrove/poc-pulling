import Cookies from "js-cookie" // Importa la libreria per i cookie
import React, { useContext, useState } from "react"
import { useNavigate } from "react-router-dom" // Importa il navigatore
import { AuthContext } from "../../../AuthContext"
import "./Login.css"

function Login() {
  const { handleLogin, handleRegister, handleOtpVerify } =
    useContext(AuthContext) // Usa AuthContext
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isRegistering) {
      if (password !== confirmPassword) {
        alert("Passwords do not match! Please try again.")
        return
      }

      handleRegister({ username, password, name, surname })
      setIsRegistered(true)
      setOtpStep(true)
    } else {
      const isLoginSuccessful = handleLogin(username, password)
      if (isLoginSuccessful) {
        const userId = "user_id_example" // Sostituisci con il valore reale dell'ID utente
        Cookies.set("username", username)
        Cookies.set("userId", userId)
        setOtpStep(true)
      }
    }
  }

  const handleOtpSubmit = (e) => {
    e.preventDefault()
    const isOtpValid = handleOtpVerify(otpCode)
    if (isOtpValid) {
      navigate("/home") // Reindirizza alla home
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
