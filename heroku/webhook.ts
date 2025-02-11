import axios from "axios"
import { Request, RequestHandler, Response, Router } from "express"

/* REMEMBER 
 telefono dura 90 giorni
 token dura 24 ore
 da aggionrnare il pagamento ma ler prime 1000 messaaggi al mese sono gratis

*/

const modelWebooksRouter = Router()

// Questa è la password che devi mettere anche nell'interfaccia di Meta
const VERIFY_TOKEN = "manfredonia77"

const WHATSAPP_TOKEN =
  "EAAQRb5SzSQUBOw08TF8rtPI40PXHNv3ZAvBPHWZCnFjrT8l8p8ZBTqx0zX5iWLpzkqIyWjQKU2RBEbFjOp5c9YpZAdibQJWFajEs2CImDpiDdRvVcmfzBd5TWSROCgDZCkcGZBRdI7siYznzdZCM8c0j7EDzlTg0EKAQGaJsw898yHJ8gIStJfhq6btyEU9KUvMmT1B5EP4PBqZCbjZANqgX1ccIb"
const WHATSAPP_API = "https://graph.facebook.com/v17.0"
const PHONE_NUMBER_ID = "539180409282748" // Sostituisci con il tuo ID

// Funzione helper per i log
function logMessage(type: string, message: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${type}: ${message}`)
  if (details) {
    console.log(JSON.stringify(details, null, 2))
  }
}

// Funzione per la verifica del webhook (GET)
async function verifyWebhook(
  req: Request,
  res: Response
): Promise<void | Response> {
  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificato con successo!")
      return res.status(200).send(challenge)
    }
    return res.sendStatus(403)
  }
}

// Funzione per ricevere i messaggi (POST)
async function receiveMessage(
  req: Request,
  res: Response
): Promise<void | Response> {
  try {
    const data = req.body

    if (data.entry && data.entry[0].changes) {
      const change = data.entry[0].changes[0]
      const value = change.value

      if (value.messages && value.messages[0]) {
        const message = value.messages[0]

        // Gestione messaggi di testo
        if (message.text) {
          const name = message.text.body.trim()
          logMessage("RECEIVED", `Nuovo utente: ${name}`, {
            from: message.from,
            timestamp: new Date().toISOString(),
          })

          await sendWelcomeMessage(message.from, name)
        }

        // Gestione risposte dai bottoni
        if (message.interactive) {
          const buttonResponse = message.interactive.button_reply
          logMessage("BUTTON", `Utente ha cliccato: ${buttonResponse.title}`, {
            from: message.from,
            buttonId: buttonResponse.id,
          })

          // Rispondi in base al bottone cliccato
          if (buttonResponse.id === "btn-yes") {
            await sendWhatsAppMessage(message.from, "Hai cliccato SÌ! 👍")
          } else if (buttonResponse.id === "btn-no") {
            await sendWhatsAppMessage(message.from, "Hai cliccato NO! 👎")
          }
        }
      }
    }

    res.status(200).json({ message: "OK" })
  } catch (error) {
    logMessage("ERROR", "Errore nel processare il messaggio", error)
    res.status(500).json({ error: "Errore del server" })
  }
}

//test
async function sendWhatsAppMessage(to: string, message: string) {
  try {
    await axios.post(
      `${WHATSAPP_API}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Errore nell'invio del messaggio:", error)
  }
}

async function sendWelcomeMessage(to: string, name: string) {
  try {
    logMessage("SENDING", `Invio messaggio di benvenuto a ${name}`, { to })

    const response = (await axios.post(
      `${WHATSAPP_API}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `Ciao *${name}*, mi chiamo Eva e sono un assistente virtuale dell'Altra Italia (https://laltrait.com/), sono un assistenza di primo livello se non riusciamo a darti l'informazione che cerchi ti metteremo in contatto con un operatore.\n\nCome ti posso aiutare oggi?`,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )) as { data: { messages: Array<{ id: string }> } }

    logMessage("SENT", `Messaggio inviato con successo a ${name}`, {
      to,
      messageId: response.data?.messages?.[0]?.id,
    })
  } catch (error: any) {
    logMessage("ERROR", `Errore nell'invio del messaggio a ${name}`, {
      to,
      error: error.response?.data || error.message,
    })
  }
}

modelWebooksRouter.get("/receive", verifyWebhook as RequestHandler)
modelWebooksRouter.post("/receive", receiveMessage as RequestHandler)

export default modelWebooksRouter
