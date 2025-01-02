import Cookies from "js-cookie" // Importa la libreria per i cookie
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom" // Importa il navigatore
import { login } from "./api/LoginApi" // Importa la funzione di login
import { register } from "./api/RegisterApi" // Importa la funzione di registrazione
import { setExpire } from "./api/SetExpireApi"
import { verifyOtp } from "./api/VerifyOtpApi" // Importa la funzione di verifica OTP
import "./Login.css"

function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [, setIsAuthenticated] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [qrCode, setQrCode] = useState("")
  const navigate = useNavigate() // Inizializza il navigatore

  useEffect(() => {
    const expire = Cookies.get("expire")

    if (expire && new Date(expire) > new Date()) {
      navigate("/home") // Redirect to home if the expire date is in the past
    }
  }, [navigate]) // Aggiungi navigate come dipendenza

  const setUserCookies = (user) => {
    Cookies.set("username", user.username)
    Cookies.set("userId", user.userId)
    Cookies.set("name", user.name)
    Cookies.set("role", user.role)
    Cookies.set("expire", user.expire)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isRegistering) {
      if (password !== confirmPassword) {
        alert("Passwords do not match! Please try again.")
        return
      }

      try {
        const response = await register({ username, password, name, surname })

        if (response.userId) {
          setUserCookies(response) // Use the utility function
          setIsRegistered(true)
          setQrCode(response.qrCode)
          setOtpStep(true)
        } else {
          alert("Registration failed! Please try again.")
        }
      } catch (error) {
        alert("Registration failed! Please try again.")
      }
    } else {
      try {
        const response = await login(username, password)
        if (response.userId) {
          setIsAuthenticated(true)
          setUserCookies(response)
          setOtpStep(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        alert("Login failed! Please check your credentials...")
      }
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()

    const userId = Cookies.get("userId")

    try {
      const param = {
        otpCode,
        userId,
      }

      const isOtpValid = await verifyOtp(param)

      if (isOtpValid) {
        const expireTimestamp = new Date(Date.now() + 30 * 60000).toISOString()
        if (expireTimestamp !== null) {
          const { token, expire } = await setExpire(userId)
          Cookies.set("token", token)
          Cookies.set("expire", expire)
          setTimeout(() => navigate("/home"), 1000)
        }
      } else {
        setOtpCode("") // Ripulisci il campo OTP
        alert("Invalid OTP! Please try again.")

        console.log("OTP code has been cleared.") // Debugging line
      }
    } catch (error) {
      alert(error.message)
      setOtpCode("")
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
              <img src={qrCode} alt="QR Code" style={{ width: "200px" }} />
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
