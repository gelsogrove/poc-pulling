import axios from "axios"
import { Request, RequestHandler, Response, Router } from "express"

const modelWebooksRouter = Router()

// Questa è la password che devi mettere anche nell'interfaccia di Meta
const VERIFY_TOKEN = "manfredonia77"

const WHATSAPP_TOKEN =
  "EAAQRb5SzSQUBO0Qjup0FrlSayZA5E6HORgvsB859nFo6ANTzt4Ow46V3iPOLxyclQDNequFTAYcBLGq9zhg8nZBFYCD7hm2aSMBbMkOj9oHdaJLT7BJZAdfUDfTEgeLG5uRe33Kq2Am08JgFP9NItFGZBAVYSGqEZBgp1NZBgYOJxmMOvV4IJG3Nc8QJ8kSZBh6myYSFZAGOZClCPw6GJtbhcEUKB"
const WHATSAPP_API = "https://graph.facebook.com/v17.0"
const PHONE_NUMBER_ID = "539180409282748" // Sostituisci con il tuo ID

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

        if (message.text) {
          // Log del messaggio ricevuto
          console.log(
            `${new Date().toISOString()} - ${message.from} > ${
              message.text.body
            }`
          )

          // Prepara la risposta
          const words = message.text.body.split(" ")
          if (words.length > 1) {
            words[1] = `*${words[1]}*`
          }
          const formattedMessage = words.join(" ").toUpperCase() + " 👋"

          // Invia e logga la risposta
          // await sendWhatsAppMessage(message.from, formattedMessage)
          await sendWhatsAppMessageWithButtons(message.from, formattedMessage)

          console.log(`Risposta inviata: ${formattedMessage}`)
        }
      }
    }

    res.status(200).json({ message: "OK" })
  } catch (error) {
    console.error("Errore:", error)
    res.status(500).json({ error: "Errore del server" })
  }
}

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

async function sendWhatsAppMessageWithButtons(to: string, message: string) {
  try {
    await axios.post(
      `${WHATSAPP_API}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: message,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "btn-yes",
                  title: "Sì",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "btn-no",
                  title: "No",
                },
              },
            ],
          },
        },
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

modelWebooksRouter.get("/receive", verifyWebhook as RequestHandler)
modelWebooksRouter.post("/receive", receiveMessage as RequestHandler)

export default modelWebooksRouter
