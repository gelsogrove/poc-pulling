/**
 * Script di esempio per inviare messaggi WhatsApp tramite l'API BuilderBot
 *
 * Uso:
 * node whatsapp-client.js <numero_telefono> "Messaggio di test"
 */

const axios = require("axios")

const SERVER_URL = "http://localhost:4999" // Modifica con la porta corretta
const NUMERO_TELEFONO = process.argv[2] || "+34654728753"
const MESSAGGIO = process.argv[3] || "Messaggio di test da BuilderBot!"

async function inviaMessaggio() {
  try {
    console.log(`Invio messaggio a ${NUMERO_TELEFONO}: "${MESSAGGIO}"`)

    const risposta = await axios.post(`${SERVER_URL}/whatsapp/send`, {
      to: NUMERO_TELEFONO,
      message: MESSAGGIO,
    })

    if (risposta.data.success) {
      console.log("Messaggio inviato con successo!")
    } else {
      console.error("Errore:", risposta.data.error)
    }
  } catch (errore) {
    console.error("Errore di connessione:", errore.message)
    if (errore.response) {
      console.error("Dettagli errore:", errore.response.data)
    }
  }
}

inviaMessaggio()
