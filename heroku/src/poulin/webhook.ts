import axios from "axios"
import dotenv from "dotenv"
import { RequestHandler } from "express"
import { getLLMResponse } from "./chatbots/main/getLLMresponse.js"
import { getPrompt } from "./utility/chatbots_utility.js"

dotenv.config()

/* REMEMBER 
 telefono dura 90 giorni
 token dura 24 ore
 da aggionrnare il pagamento ma ler prime 1000 messaaggi al mese sono gratis

*/

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
export const verifyWebhook: RequestHandler = async (req, res) => {
  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  logMessage("VERIFY", "Richiesta di verifica webhook ricevuta", {
    mode,
    token,
    challenge,
  })

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      logMessage("VERIFY", "Webhook verificato con successo!")
      res.status(200).send(challenge)
      return
    }
    logMessage("VERIFY", "Verifica fallita: token non valido")
    res.sendStatus(403)
    return
  }
  logMessage("VERIFY", "Verifica fallita: parametri mancanti")
  res.sendStatus(400)
}

// Funzione per ricevere i messaggi (POST)
export const receiveMessage: RequestHandler = async (req, res) => {
  try {
    const data = req.body
    logMessage("RECEIVE", "Messaggio ricevuto", data)

    if (data.entry && data.entry[0].changes) {
      const change = data.entry[0].changes[0]
      const value = change.value

      if (value.messages && value.messages[0]) {
        const message = value.messages[0]

        // Ottieni il prompt predefinito
        let promptData = await getPrompt(DEFAULT_PROMPT_ID)
        if (!promptData) {
          logMessage("ERROR", "Prompt predefinito non trovato")
          // Usa un prompt di fallback
          promptData = {
            prompt:
              "Sei un assistente virtuale italiano. Rispondi in modo cortese e professionale.",
            model: "openai/gpt-3.5-turbo",
            temperature: 0.7,
          }
        }

        // Gestione messaggi di testo
        if (message.text) {
          const userMessage = message.text.body.trim()
          logMessage("RECEIVED", `Messaggio: ${userMessage}`, {
            from: message.from,
            timestamp: new Date().toISOString(),
          })

          // Crea history con il messaggio dell'utente
          const history = [{ role: "user", content: userMessage }]

          // Ottieni risposta dal modello LLM
          const llmResponse = await getLLMResponse(
            userMessage,
            promptData,
            history
          )

          // Invia la risposta generata dall'IA
          await sendWhatsAppMessage(message.from, llmResponse.content)
          logMessage("SENT", "Risposta inviata", {
            response: llmResponse.content,
          })
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
            buttonResponse.title,
            promptData,
            history
          )

          // Invia la risposta generata dall'IA
          await sendWhatsAppMessage(message.from, llmResponse.content)
          logMessage("SENT", "Risposta inviata", {
            response: llmResponse.content,
          })
        }
      }
    }

    res.status(200).json({ message: "OK" })
  } catch (error) {
    logMessage("ERROR", "Errore nel processare il messaggio", error)
    res.status(500).json({ error: "Errore del server" })
  }
}

async function sendWhatsAppMessage(to: string, message: string) {
  try {
    logMessage("SENDING", `Invio messaggio a ${to}`, { message })

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

    logMessage("SENT", `Messaggio inviato con successo a ${to}`)
  } catch (error) {
    logMessage("ERROR", "Errore nell'invio del messaggio", error)
    throw error
  }
}

// Funzione per inviare il messaggio di benvenuto
export async function sendWelcomeMessage(to: string, name: string) {
  try {
    logMessage("SENDING", `Invio messaggio di benvenuto a ${name}`, { to })

    // Ottieni il prompt predefinito
    const promptData = await getPrompt(DEFAULT_PROMPT_ID)
    if (!promptData) {
      throw new Error("Prompt predefinito non trovato")
    }

    // Prima ottieni una risposta dal modello LLM per un messaggio di benvenuto
    const history = [
      {
        role: "user",
        content:
          "Salutami e chiedimi come posso aiutarti, sono un nuovo utente.",
      },
    ]

    // Ottieni risposta dal modello LLM
    const llmResponse = await getLLMResponse("Benvenuto", promptData, history)

    // Invia un messaggio interattivo con la risposta del modello
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
            text: llmResponse.content,
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
    )

    logMessage("SENT", "Messaggio di benvenuto inviato")
  } catch (error) {
    logMessage("ERROR", "Errore nell'invio del messaggio di benvenuto", error)
    throw error
  }
}
