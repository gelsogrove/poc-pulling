const fs = require("fs")
const speakeasy = require("speakeasy")
const qrcode = require("qrcode")

// Percorso del file dove salvare il segreto
const secretFilePath = "secret.txt"

// Genera un nuovo segreto
const secret = speakeasy.generateSecret({ length: 20 })
console.log("Generato un nuovo segreto:", secret.base32)

// Salva il segreto nel file
fs.writeFile(secretFilePath, secret.base32, "utf8", (err) => {
  if (err) {
    console.error("❌ Errore salvando il segreto:", err)
  } else {
    console.log(`✅ Segreto salvato nel file: ${secretFilePath}`)
  }
})

// Genera un URL compatibile con le app di autenticazione
const otpauthUrl = speakeasy.otpauthURL({
  secret: secret.base32,
  label: "IlTuoServizio",
  issuer: "IlTuoServizio",
  encoding: "base32",
})

// Genera e salva il QR Code come immagine
const qrFilePath = "qrcode.png"
qrcode.toFile(qrFilePath, otpauthUrl, (err) => {
  if (err) {
    console.error("❌ Errore generando il QR Code:", err)
  } else {
    console.log(`✅ QR Code salvato come immagine: ${qrFilePath}`)
  }
})
