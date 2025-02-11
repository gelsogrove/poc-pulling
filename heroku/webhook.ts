import axios from "axios"
import { Request, RequestHandler, Response, Router } from "express"

const modelWebooksRouter = Router()

// Questa è la password che devi mettere anche nell'interfaccia di Meta
const VERIFY_TOKEN = "manfredonia77"

const WHATSAPP_TOKEN = "IL_TUO_TOKEN_QUI"
const WHATSAPP_API = "https://graph.facebook.com/v17.0"
const PHONE_NUMBER_ID = "IL_TUO_PHONE_NUMBER_ID" // Sostituisci con il tuo ID

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
    console.log("=== NUOVO MESSAGGIO WHATSAPP ===")
    console.log("Struttura completa:", JSON.stringify(data, null, 2))

    if (data.entry && data.entry[0].changes) {
      const change = data.entry[0].changes[0]
      const value = change.value

      if (value.messages && value.messages[0]) {
        const message = value.messages[0]
        console.log("=== DETTAGLI MESSAGGIO ===")
        console.log("Da:", message.from)
        console.log("Tipo:", message.type)
        if (message.text) {
          console.log("Testo:", message.text.body)
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

modelWebooksRouter.get("/receive", verifyWebhook as RequestHandler)
modelWebooksRouter.post("/receive", receiveMessage as RequestHandler)

export default modelWebooksRouter
