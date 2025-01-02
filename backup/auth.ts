import bcrypt from "bcrypt"
import { RequestHandler, Router } from "express"
import qrcode from "qrcode"
import speakeasy from "speakeasy"
import { pool } from "../server.js" // Importa il pool dal file principale

const authRouter = Router()

// Handler per il login
const loginHandler: RequestHandler = async (req, res) => {
  const { username, password } = req.body // Estrae username e password dal corpo della richiesta

  // Controlla se username e password sono forniti
  if (!username || !password) {
    res.status(400).json({ message: "Username e password sono richiesti" }) // Restituisce errore 400 se mancano dati
    return
  }

  // Esegui una query per cercare l'utente nel database
  const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ])

  // Se l'utente non viene trovato, restituisci un errore 404
  if (rows.length === 0) {
    res.status(404).json({ message: "Utente non trovato" })
    return
  }

  const user = rows[0] // Prendi il primo utente trovato

  // Verifica la password criptata
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    res.status(401).json({ message: "Password non valida" })
    return
  }

  // Non inviare la password nel response
  delete user.password
  res.status(200).json(user) // Restituisce i dettagli dell'utente
}

// Handler per la registrazione
const registerHandler: RequestHandler = async (req, res) => {
  const { username, name, surname, password, email } = req.body // Estrae email dal corpo della richiesta

  // Controlla se l'utente esiste già nel database
  const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ])
  if (rows.length > 0) {
    res.status(400).json({ message: "Utente già esistente" })
    return
  }

  // Genera il segreto OTP
  const secret = speakeasy.generateSecret({ length: 20 })

  // Genera l'URL otpauth con un nome specifico
  const otpauthUrl = `otpauth://totp/${username}?secret=${secret.base32}&issuer=Poulin Secretkey` // Sostituisci "NomeDelServizio" con il nome desiderato

  // Cripta la password
  const hashedPassword = await bcrypt.hash(password, 10) // Usa bcrypt per criptare la password

  // Inserisci utente con il segreto OTP nel database
  const result = await pool.query(
    "INSERT INTO users (username, name, surname, password, expire_date, role, otp_secret) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [username, name, surname, hashedPassword, new Date(), null, secret.base32]
  )

  // Genera QR code per il segreto OTP
  const qrCode = await qrcode.toDataURL(otpauthUrl)

  // Restituisce i dettagli dell'utente e il QR code in formato Base64
  res.status(201).json({
    user: result.rows[0],
    qrCode, // L'URL del QR code è già in formato Base64
  })
}

// Handler per la verifica dell'OTP
const verifyOtpHandler: RequestHandler = async (req, res) => {
  const { userId, otp } = req.body // Estrae username e OTP dal corpo della richiesta

  // Esegui una query per cercare l'utente nel database
  const { rows } = await pool.query("SELECT * FROM users WHERE userId = $1", [
    userId,
  ])

  if (rows.length === 0) {
    res.status(404).json({ message: "Utente non trovato" }) // Restituisce errore 404 se l'utente non viene trovato
    return
  }

  const user = rows[0] // Prendi il primo utente trovato

  // Verifica l'OTP utilizzando il segreto dell'utente
  const verified = speakeasy.totp.verify({
    secret: user.otp_secret,
    encoding: "base32",
    token: otp,
  })

  // Se l'OTP non è valido, restituisci un errore 400
  if (!verified) {
    res.status(400).json({ message: "OTP non valido" })
    return
  }

  res.status(200).json()
}

// Handler per ottenere la data di scadenza
const getExpire: RequestHandler = async (req, res) => {
  const { userId } = req.params // Estrae userId dai parametri della richiesta

  const { rows } = await pool.query(
    "SELECT expire_date FROM users WHERE userId = $1",
    [userId]
  )

  if (rows.length === 0) {
    res.status(404).json({ message: "Utente non trovato" })
    return
  }

  const { expire_date } = rows[0]
  res.status(200).json({ expire_date })
}

// Handler per aggiornare la data di scadenza
const updateExpire: RequestHandler = async (req, res) => {
  const { userId } = req.params // Estrae userId dai parametri della richiesta
  const { expireDate } = req.body // Estrae la nuova data di scadenza dal corpo della richiesta

  // Esegui una query per aggiornare la data di scadenza
  await pool.query("UPDATE users SET expire_date = $1 WHERE userId = $2", [
    expireDate,
    userId,
  ])

  res.status(200).json({ message: "Data di scadenza aggiornata con successo" }) // Restituisce un messaggio di successo
}

// Handler per verificare se l'utente è scaduto
const isExpired: RequestHandler = async (req, res) => {
  const { userId } = req.params // Estrae userId dai parametri della richiesta

  const { rows } = await pool.query(
    "SELECT expire_date FROM users WHERE userId = $1",
    [userId]
  )

  if (rows.length === 0) {
    res.status(404).json({ message: "Utente non trovato" }) // Restituisce errore 404 se l'utente non viene trovato
    return
  }

  const { expire_date } = rows[0]
  const isExpired = new Date(expire_date) < new Date() // Confronta la data di scadenza con l'ora attuale

  res.status(200).json({ isExpired }) // Restituisce true o false
}

// Definisci le rotte per il router di autenticazione
authRouter.post("/login", loginHandler) // Rotta per il login
authRouter.post("/register", registerHandler) // Rotta per la registrazione
authRouter.post("/verify-otp", verifyOtpHandler) // Rotta per la verifica dell'OTP
authRouter.get("/expire/:userId", getExpire) // Rotta per ottenere la data di scadenza
authRouter.post("/expire/:userId", updateExpire) // Rotta per aggiornare la data di scadenza
authRouter.get("/is-expired/:userId", isExpired) // Rotta per verificare se l'utente è scaduto

export default authRouter // Esporta il router di autenticazione
