// Script per testare l'invio di messaggi WhatsApp
import axios from "axios"
import dotenv from "dotenv"

// Carica le variabili d'ambiente
dotenv.config()

// Configurazione
const API_URL =
  process.env.CHATBOT_WEBHOOK_API_URL || "https://graph.facebook.com/v22.0"
const PHONE_NUMBER_ID = process.env.CHATBOT_WEBHOOK_SENDER_ID || ""
const RECIPIENT_NUMBER = "" // Inserisci qui il numero di telefono del destinatario
const ACCESS_TOKEN = process.env.CHATBOT_WEBHOOK_BEARER_TOKEN || ""

/**
 * Invia un messaggio di testo tramite WhatsApp
 * @param {string} to - Numero di telefono del destinatario
 * @param {string} text - Testo del messaggio
 * @returns {Promise<object>} - Risposta dell'API
 */
async function sendTextMessage(to, text) {
  console.log(`Invio messaggio di testo a ${to}: "${text}"`)

  const url = `${API_URL}/${PHONE_NUMBER_ID}/messages`

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  }

  console.log("URL:", url)
  console.log("Payload:", JSON.stringify(payload, null, 2))

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Risposta:", response.data)
    return response.data
  } catch (error) {
    console.error(
      "Errore nell'invio del messaggio di testo:",
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Invia un messaggio template tramite WhatsApp
 * @param {string} to - Numero di telefono del destinatario
 * @returns {Promise<object>} - Risposta dell'API
 */
async function sendTemplateMessage(to) {
  console.log(`Invio messaggio template a ${to}`)

  const url = `${API_URL}/${PHONE_NUMBER_ID}/messages`

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: "hello_world",
      language: {
        code: "en_US",
      },
    },
  }

  console.log("URL:", url)
  console.log("Payload:", JSON.stringify(payload, null, 2))

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Risposta:", response.data)
    return response.data
  } catch (error) {
    console.error(
      "Errore nell'invio del messaggio template:",
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Esegue i test di invio messaggi
 */
async function runTests() {
  console.log("=== CONFIGURAZIONE ===")
  console.log("API URL:", API_URL)
  console.log("PHONE NUMBER ID:", PHONE_NUMBER_ID)
  console.log("RECIPIENT NUMBER:", RECIPIENT_NUMBER || "Non configurato")
  console.log("ACCESS TOKEN configurato:", !!ACCESS_TOKEN)
  console.log("====================\n")

  if (!RECIPIENT_NUMBER) {
    console.error(
      "Errore: RECIPIENT_NUMBER non configurato. Modifica il file per impostare il numero del destinatario."
    )
    return
  }

  try {
    console.log("=== TEST MESSAGGIO DI TESTO ===")
    await sendTextMessage(
      RECIPIENT_NUMBER,
      "Ciao! Questo è un messaggio di test inviato tramite l'API di WhatsApp."
    )
    console.log("Test messaggio di testo completato con successo.\n")

    console.log("=== TEST MESSAGGIO TEMPLATE ===")
    await sendTemplateMessage(RECIPIENT_NUMBER)
    console.log("Test messaggio template completato con successo.\n")

    console.log("Tutti i test completati con successo!")
  } catch (error) {
    console.error("Errore durante l'esecuzione dei test:", error.message)
  }
}

// Esegui i test
runTests()
