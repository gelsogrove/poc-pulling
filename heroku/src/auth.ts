import bcrypt from "bcrypt"
import { RequestHandler, Router } from "express"
import qrcode from "qrcode"
import speakeasy from "speakeasy"
import { v4 as uuidv4 } from "uuid" // Importa uuid
import { pool } from "../server.js" // Importa il pool dal file principale

import { getUserIdByToken } from "./validateUser.js"

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

  res.status(200).json({
    username: user.username,
    userId: user.userid,
    name: user.name,
    role: user.role,
    expire: user.expire,
  })
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
    "INSERT INTO users (username, name, surname, password, expire_date, role, otp_secret) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING userId, username, name, role",
    [username, name, surname, hashedPassword, null, null, secret.base32]
  )

  // Genera QR code per il segreto OTP
  const qrCode = await qrcode.toDataURL(otpauthUrl)

  // Restituisce i dettagli dell'utente richiesti
  res.status(201).json({
    userId: result.rows[0].userid,
    qrCode,
    name,
  })
}

// Handler per la verifica dell'OTP
const verifyOtpHandler: RequestHandler = async (req, res) => {
  const { userId, otpCode } = req.body // Estrae username e OTP dal corpo della richiesta

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
    token: otpCode,
  })

  // Se l'OTP non è valido, restituisci un errore 400
  if (!verified) {
    res.status(400).json({ message: "OTP non valido" })
    return
  }

  res.status(200).json()
}

// Handler per aggiornare la data di scadenza
const setExpire: RequestHandler = async (req, res) => {
  const { userId } = req.body

  // Calcola la nuova data di scadenza (30 minuti da ora)
  const newExpireDate = new Date(Date.now() + 59 * 60 * 1000) // Aggiungi 30 minuti

  // Genera un nuovo token
  const token = uuidv4() // Genera un token unico

  // Esegui una query per aggiornare la data di scadenza e il token
  await pool.query(
    "UPDATE users SET expire_date = $1, token = $2 WHERE userid = $3",
    [
      newExpireDate, // Usa la nuova data di scadenza
      token, // Aggiungi il token all'update
      userId,
    ]
  )

  // Nuova query per ottenere la data di scadenza aggiornata
  const { rows } = await pool.query(
    "SELECT expire_date FROM users WHERE userid = $1",
    [userId]
  )
  const updatedExpireDate = rows[0]?.expire_date // Ottieni la data di scadenza aggiornata

  res.status(200).json({
    token,
    expire: updatedExpireDate,
  })
}

// Handler per verificare se l'utente è scaduto
const isExpired: RequestHandler = async (req, res) => {
  const { token } = req.body

  // Estrai l'userId dal token
  const userId = await getUserIdByToken(token) // Aggiunta della funzione per estrarre userId
  if (!userId) {
    res.status(400).json({ message: "Token non valido" }) // Restituisce errore se il token non è valido
    return
  }

  // Esegui una query per cercare la data di scadenza
  const { rows } = await pool.query(
    "SELECT expire_date FROM users WHERE userId = $1",
    [userId]
  )

  if (rows.length === 0) {
    res.status(404).json({ message: "Utente non trovato" })
    return
  }

  const { expire_date } = rows[0]
  const isExpired = new Date(expire_date) < new Date()

  res.status(200).json({ isExpired })
}

// Handler per il logout
const logoutHandler: RequestHandler = async (req, res) => {
  const { token } = req.body // Estrae il token dal corpo della richiesta

  // Estrai l'userId dal token
  const userId = await getUserIdByToken(token) // Aggiunta della funzione per estrarre userId
  if (!userId) {
    res.status(400).json({ message: "Token non valido" }) // Restituisce errore se il token non è valido
    return
  }

  // Aggiorna il campo token e expire_date nel database
  await pool.query(
    "UPDATE users SET token = NULL, expire_date = NULL WHERE userid = $1",
    [userId]
  )

  res.status(200).json({ message: "Logout" }) // Risposta di successo
}

// Definisci le rotte per il router di autenticazione
authRouter.post("/login", loginHandler) // Rotta per il login
authRouter.post("/register", registerHandler) // Rotta per la registrazione
authRouter.post("/verify-otp", verifyOtpHandler) // Rotta per la verifica dell'OTP
authRouter.put("/set-expire", setExpire) // Rotta per aggiornare la data di scadenza
authRouter.post("/is-expired/", isExpired) // Rotta per verificare se l'utente è scaduto
authRouter.post("/logout", logoutHandler) // Rotta per il logout

export default authRouter // Esporta il router di autenticazione
