const express = require("express")
const speakeasy = require("speakeasy")
const qrcode = require("qrcode")
const axios = require("axios")

const app = express()
app.use(express.json())

// Endpoint per effettuare il login
app.post("/login", async (req, res) => {
  const { username, password } = req.body

  // Step 1: Validazione dei dati forniti
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." })
  }

  try {
    // Step 2: Collegarsi all'API di login.php per verificare le credenziali
    const loginResponse = await axios.post("http://example.com/login.php", {
      username,
      password,
    })

    // Step 3: ritorna i dati.
    if (loginResponse.data.status !== "success") {
      return res.status(401).json({ error: "Invalid username or password." })
    }

    return res.status(200).json({ status: "ok" })
  } catch (error) {
    return res.status(500).json({ error })
  }
})

// Endpoint per registrare un nuovo utente
app.post("/register", async (req, res) => {
  const { username, password, name, surname } = req.body

  // Step 1: Validazione dei dati forniti
  if (!username || !password || !name || !surname) {
    return res.status(400).json({ error: "All fields are required." })
  }

  try {
    // Step 2: Controllare se l'utente esiste già
    const existingUserResponse = await axios.post(
      "http://example.com/check-user.php",
      { username }
    )

    if (existingUserResponse.data.exists) {
      return res.status(409).json({ error: "User already exists." })
    }

    // Step 3: Creare un nuovo utente tramite newuser.php e ottenere l'ID
    const newUserResponse = await axios.post("http://example.com/newuser.php", {
      username,
      password,
      name,
      surname, // Include il cognome
    })

    if (!newUserResponse.data || !newUserResponse.data.userId) {
      return res.status(500).json({ error: "Failed to create new user." })
    }

    const userId = newUserResponse.data.userId // ID Utente da utilizzare nello Step 5

    // Step 4: Generare il segreto OTP
    const secret = speakeasy.generateSecret({ length: 20 })

    // Step 5: Inviare il segreto OTP a updatesecret.php usando l'ID Utente
    const updateSecretResponse = await axios.post(
      "http://example.com/updatesecret.php",
      { userId, secret: secret.base32 }
    )

    if (updateSecretResponse.data.status !== "success") {
      return res.status(500).json({ error: "Failed to update secret." })
    }

    // Step 6: Generare un URL OTP compatibile
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `Poulin`,
      issuer: "Poulin",
    })

    // Step 7: Generare il QR Code in formato Base64
    const qrCodeBase64 = await qrcode.toDataURL(otpAuthUrl)

    // Step 8: Rispondere con l'immagine QR Code in formato Base64
    return res.status(201).json({
      message: "User registered successfully.",
      userId,
      qrCodeBase64,
    })
  } catch (error) {
    console.error("Error during registration:", error.message)
    return res.status(500).json({ error: "Internal server error." })
  }
})

// Endpoint per verificare il codice OTP
app.post("/verify-otp", (req, res) => {
  // Step 1: Leggere `username` e `otp` dal corpo della richiesta.
  // - Assicurarsi che entrambi i campi siano presenti.
  // Step 2: Cercare l'utente nel database mock o reale.
  // - Usare il `username` per identificare l'utente.
  // Step 3: Verificare il codice OTP fornito dall'utente.
  // - Usa `speakeasy.totp.verify` con il segreto dell'utente.
  // - Specificare `window` per permettere margini temporali.
  // Step 4: Rispondere in base al risultato della verifica.
  // - Se il codice è corretto, rispondere con `200 OK`.
  // - Se il codice è errato, rispondere con `401 Unauthorized`.
  // - Se l'utente non esiste, rispondere con `404 Not Found`.
})

// Avvio del server
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001")
})
