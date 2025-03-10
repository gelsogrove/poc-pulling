import axios from "axios"
import dotenv from "dotenv"
import { Request, RequestHandler, Response, Router } from "express"
import { getLLMResponse } from "./chatbots/main/getLLMresponse.js"

dotenv.config()

/* REMEMBER 
 telefono dura 90 giorni
 token dura 24 ore
 da aggionrnare il pagamento ma ler prime 1000 messaaggi al mese sono gratis

*/

const modelWebooksRouter = Router()

// Leggi il token di verifica dalla variabile d'ambiente
const VERIFY_TOKEN = process.env.CHATBOT_WEBHOOK_VERIFY_TOKEN || "manfredonia77"

/*

Vai su business.facebook.com
Business Settings > Users > System Users > Clicca "Add" > Dai un nome (es. "WhatsApp API Bot")
Assegna ruolo "Admin"

Assegna Assets:
Nella sezione "Add Assets"
Seleziona la tua app WhatsApp
Dai permesso "Full Control"
Genera Token:
Vai sulla scheda del System User creato
Clicca "Generate New Token"
Seleziona questi permessi:
whatsapp_business_messaging
whatsapp_business_management

Salva il Token:
Copia il token generato
Salvalo in modo sicuro
Questo token non scade
*/

// Leggi il token e l'URL dell'API dalle variabili d'ambiente
const WHATSAPP_TOKEN = process.env.CHATBOT_WEBHOOK_BEARER_TOKEN || ""
const WHATSAPP_API =
  process.env.CHATBOT_WEBHOOK_API_URL || "https://graph.facebook.com/v17.0"

// Leggi l'ID del numero di telefono dalla variabile d'ambiente
const PHONE_NUMBER_ID =
  process.env.PHONE_NUMBER_ID || process.env.CHATBOT_WEBHOOK_SENDER_ID || ""

// Prompt predefinito per la chatbot
const DEFAULT_PROMPT_ID = "default-chatbot-prompt"

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
          const userMessage = message.text.body.trim()
          logMessage("RECEIVED", `Nuovo utente: ${userMessage}`, {
            from: message.from,
            timestamp: new Date().toISOString(),
          })

          // Crea history con il messaggio dell'utente
          const history = [{ role: "user", content: userMessage }]

          // Ottieni risposta dal modello LLM
          const llmResponse = await getLLMResponse(
            DEFAULT_PROMPT_ID,
            history,
            "whatsapp-webhook"
          )

          // Estrai il testo della risposta
          const responseText =
            typeof llmResponse.content === "string"
              ? llmResponse.content
              : JSON.stringify(llmResponse.content)

          // Invia la risposta generata dall'IA
          await sendWhatsAppMessage(message.from, responseText)
        }

        // Gestione risposte dai bottoni
        if (message.interactive) {
          const buttonResponse = message.interactive.button_reply
          logMessage("BUTTON", `Utente ha cliccato: ${buttonResponse.title}`, {
            from: message.from,
            buttonId: buttonResponse.id,
          })

          // Crea history con il messaggio del bottone
          const history = [
            { role: "user", content: `Ho cliccato ${buttonResponse.title}` },
          ]

          // Ottieni risposta dal modello LLM
          const llmResponse = await getLLMResponse(
            DEFAULT_PROMPT_ID,
            history,
            "whatsapp-webhook"
          )

          // Estrai il testo della risposta
          const responseText =
            typeof llmResponse.content === "string"
              ? llmResponse.content
              : JSON.stringify(llmResponse.content)

          // Invia la risposta generata dall'IA
          await sendWhatsAppMessage(message.from, responseText)
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

// Funzione per inviare il messaggio di benvenuto (ora usa bottoni per interazione iniziale)
async function sendWelcomeMessage(to: string, name: string) {
  try {
    logMessage("SENDING", `Invio messaggio di benvenuto a ${name}`, { to })

    // Prima ottieni una risposta dal modello LLM per un messaggio di benvenuto
    const history = [
      {
        role: "user",
        content:
          "Salutami e chiedimi come posso aiutarti, sono un nuovo utente.",
      },
    ]

    // Ottieni risposta dal modello LLM
    const llmResponse = await getLLMResponse(
      DEFAULT_PROMPT_ID,
      history,
      "whatsapp-welcome"
    )

    // Estrai il testo della risposta
    const welcomeText =
      typeof llmResponse.content === "string"
        ? llmResponse.content
        : JSON.stringify(llmResponse.content)

    // Invia un messaggio interattivo con la risposta del modello
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
            text: welcomeText,
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "btn-info",
                  title: "Informazioni",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "btn-help",
                  title: "Aiuto",
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
