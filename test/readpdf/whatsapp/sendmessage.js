const axios = require("axios")

// Configurazione base
const config = {
  phoneNumberId: "539180409282748",
  accessToken: "EAAQRb5SzSQUBO...",
  version: "v22.0",
}

// Funzione semplice per rispondere
async function rispondiMessaggio(numeroUtente, testoRisposta) {
  try {
    const response = await axios({
      method: "POST",
      url: `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to: numeroUtente,
        type: "text",
        text: {
          body: testoRisposta,
        },
      },
    })

    console.log("Risposta inviata con successo!")
    return response.data
  } catch (error) {
    console.error("Errore nell'invio:", error.message)
    throw error
  }
}

// Esempio di utilizzo
async function test() {
  try {
    // Quando ricevi un messaggio, rispondi così:
    await rispondiMessaggio(
      "34654728753", // numero di chi ti ha scritto
      "Grazie per il tuo messaggio! Ti rispondo subito..."
    )
  } catch (error) {
    console.error("Errore:", error)
  }
}

test()

module.exports = { rispondiMessaggio }
