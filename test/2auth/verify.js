const fs = require("fs")
const speakeasy = require("speakeasy")
const readline = require("readline")

// Percorso del file dove è salvato il segreto
const secretFilePath = "secret.txt"

// Controlla se il file con il segreto esiste
if (!fs.existsSync(secretFilePath)) {
  console.error(
    "❌ Errore: il file con il segreto non esiste. Esegui prima `setup.js` per generare il segreto."
  )
  process.exit(1)
}

// Legge il segreto salvato
const secret = fs.readFileSync(secretFilePath, "utf8")

// Creiamo un'interfaccia per accettare input dall'utente
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Chiediamo all'utente di inserire il codice OTP
rl.question("Inserisci il codice OTP: ", (userInput) => {
  // Verifica il codice OTP fornito dall'utente
  const verified = speakeasy.totp.verify({
    secret: secret, // Usa il segreto salvato
    encoding: "base32",
    token: userInput, // Codice inserito dall'utente
    window: 1, // Permetti un piccolo margine temporale
  })

  if (verified) {
    console.log("✅ Codice OTP valido!")
  } else {
    console.log("❌ Codice OTP non valido.")
  }

  rl.close()
})
