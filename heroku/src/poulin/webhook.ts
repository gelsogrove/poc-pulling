import axios from "axios"
import dotenv from "dotenv"
import { Request, Response } from "express"
import { getLLMResponse } from "./chatbots/main/getLLMresponse.js"
import { getPrompt } from "./utility/chatbots_utility.js"
import { convertToMarkdown } from "./utils/markdownConverter.js"

dotenv.config()

/* REMEMBER 
 telefono dura 90 giorni
 token dura 24 ore
 da aggionrnare il pagamento ma ler prime 1000 messaaggi al mese sono gratis

*/

// Leggi il token di verifica dalla variabile d'ambiente
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "manfredonia77"

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
const WHATSAPP_TOKEN =
  process.env.WEBHOOK_BEARER_TOKEN ||
  "EAAQRb5SzSQUBO0KUwJykgKgpx9AYy1PRZBPXhgWmEyyQnWjWsE2mw9c4Eg2ysPDvajXHXfAUQzCIKN3aEhoCFe0ZBtVYqAzdcwDp0w8hGpwQc8EiViYZCO37q4oEDWRplYzoQZBb0yXfBxKp3Y4k3qN8c0tfMwKkUwnznFfCiwe2NqNXY9DZCyZCUiTNuOXDRlS4pbYmZBP2CiGeKgbqglXBdxP"
const WHATSAPP_API_VERSION = process.env.CHATBOT_WEBHOOK_API_VERSION || "v17.0"
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID

// ID del prompt principale per il routing
const MAIN_PROMPT_ID = "d0866b7d-8aaa-4dba-abce-45c75e3e730f"

// Mappa dei target validi e loro configurazioni
type ValidTarget =
  | "sales"
  | "support"
  | "general"
  | "products"
  | "orders"
  | string

// Mappa delle configurazioni dei target
interface TargetConfig {
  promptId: string
}

const targetConfigs: Record<ValidTarget, TargetConfig> = {
  sales: { promptId: "prompt-sales-id" },
  support: { promptId: "prompt-support-id" },
  general: { promptId: "prompt-general-id" },
  orders: { promptId: "prompt-orders-id" },
  products: { promptId: "prompt-products-id" },
}

// Determine the base URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.HEROKU_APP_URL || "https://poulin-chatbot.herokuapp.com"
    : "http://localhost:3001"

// Funzione helper per i log
function logMessage(type: string, message: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${type}: ${message}`)
  if (details) {
    // Per messaggi RECEIVE con payload WhatsApp, mostra solo un riassunto
    if (type === "RECEIVE" && details.entry && details.entry[0]?.changes) {
      const change = details.entry[0].changes[0]
      const messages = change?.value?.messages
      if (messages && messages.length > 0) {
        console.log(
          JSON.stringify(
            {
              summary: `${messages.length} messaggi ricevuti`,
              sender: messages[0].from,
              type: messages[0].type,
              id: messages[0].id.substring(0, 8) + "...",
            },
            null,
            2
          )
        )
        return
      }
    }

    // Per altri oggetti, se sono grandi mostra solo proprietà principali
    const detailsStr = JSON.stringify(details)
    if (detailsStr.length < 200) {
      console.log(detailsStr)
    } else {
      // Mostra solo alcune proprietà chiave per oggetti grandi
      const summary = {
        message: details.message || "(non disponibile)",
        from: details.from || "(non disponibile)",
        response: details.response
          ? details.response.substring(0, 100) + "..."
          : "(non disponibile)",
      }
      console.log(JSON.stringify(summary, null, 2))
    }
  }
}

// Funzione per la verifica del webhook (GET)
export const verifyWebhook = (req: Request, res: Response) => {
  logMessage("INFO", "Webhook verification request received")
  logMessage("INFO", `Environment: ${process.env.NODE_ENV}`)
  logMessage("INFO", `Using base URL: ${BASE_URL}`)

  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  logMessage(
    "INFO",
    `Verification params - Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`
  )

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      logMessage("SUCCESS", "Webhook verified successfully!")
      res.status(200).send(challenge)
    } else {
      logMessage("ERROR", "Verification failed: invalid token or mode")
      res.sendStatus(403)
    }
  } else {
    logMessage("ERROR", "Verification failed: missing parameters")
    res.sendStatus(403)
  }
}

// Funzione per ricevere i messaggi (POST)
export const receiveMessage = async (req: Request, res: Response) => {
  try {
    const data = req.body
    logMessage("RECEIVE", "Messaggio ricevuto", data)

    if (data.entry && data.entry[0].changes) {
      const change = data.entry[0].changes[0]
      const value = change.value

      if (value.messages && value.messages[0]) {
        const message = value.messages[0]

        // Log specifico per numeri spagnoli (+34)
        if (message.from.startsWith("34")) {
          logMessage(
            "SPAIN",
            `Messaggio ricevuto dal numero +${message.from}`,
            {
              timestamp: new Date().toISOString(),
              messageType: message.type,
            }
          )
        }

        // Ottieni il prompt principale per il routing
        let mainPromptData = await getPrompt(MAIN_PROMPT_ID)
        if (!mainPromptData) {
          logMessage("ERROR", "Prompt principale non trovato")
          // Usa un prompt di fallback
          mainPromptData = {
            prompt:
              "Sei un assistente virtuale italiano. Rispondi in modo cortese e professionale.",
            model: "openai/gpt-3.5-turbo",
            temperature: 0.7,
          }
        }

        // Usiamo direttamente il numero di telefono come identificativo
        const phoneNumber = message.from
        logMessage("INFO", `Gestione messaggio per telefono: ${phoneNumber}`)

        // Gestione messaggi di testo
        if (message.text) {
          const userMessage = message.text.body.trim()
          logMessage("RECEIVED", `Messaggio: ${userMessage}`, {
            from: message.from,
            timestamp: new Date().toISOString(),
          })

          try {
            // Inizia a misurare il tempo di elaborazione
            const startTime = new Date()

            // Creiamo un array di messaggi semplice per il contesto
            // Per ora non salviamo la cronologia nel database
            const history = [{ role: "user", content: userMessage }]

            // Processa il messaggio con il chatbot principale per determinare il routing
            const routingResult = await processWithMainChatbot(
              userMessage,
              mainPromptData,
              history
            )

            // Routing al sub-chatbot appropriato
            let finalResponse
            if (routingResult.target) {
              // Se è stato determinato un target, usa il sub-chatbot
              finalResponse = await routeToSubChatbot(
                routingResult.target,
                userMessage,
                phoneNumber,
                history
              )
              logMessage(
                "INFO",
                `Risposta dal sub-chatbot ${routingResult.target}`,
                {
                  responsePreview:
                    finalResponse.content.substring(0, 50) + "...",
                }
              )
            } else {
              // Altrimenti usa direttamente la risposta del chatbot principale
              finalResponse = { content: routingResult.content }
            }

            // Converti in markdown se necessario
            const formattedResponse = convertToMarkdown(finalResponse.content)

            // Aggiungiamo la risposta alla history locale (solo per questa sessione)
            history.push({
              role: "assistant",
              content: formattedResponse,
            })

            // Invia la risposta finale
            await sendWhatsAppMessage(message.from, formattedResponse)
            logMessage("SENT", "Risposta inviata", {
              response: formattedResponse.substring(0, 50) + "...",
              processingTime: `${
                (new Date().getTime() - startTime.getTime()) / 1000
              } sec`,
            })
          } catch (error) {
            logMessage("ERROR", "Errore nell'elaborazione del messaggio", error)
            await sendWhatsAppMessage(
              message.from,
              "Mi dispiace, si è verificato un errore nell'elaborazione del messaggio. Riprova più tardi."
            )
          }
        }

        // Gestione risposte dai bottoni
        if (message.interactive) {
          const buttonResponse = message.interactive.button_reply
          logMessage("BUTTON", `Utente ha cliccato: ${buttonResponse.title}`, {
            from: message.from,
            buttonId: buttonResponse.id,
          })

          try {
            const startTime = new Date()

            // Semplice array di messaggi per il contesto
            const history = [
              { role: "user", content: `Ho cliccato ${buttonResponse.title}` },
            ]

            // Processa con il chatbot principale
            const routingResult = await processWithMainChatbot(
              buttonResponse.title,
              mainPromptData,
              history
            )

            // Routing al sub-chatbot appropriato
            let finalResponse
            if (routingResult.target) {
              finalResponse = await routeToSubChatbot(
                routingResult.target,
                buttonResponse.title,
                phoneNumber,
                history
              )
            } else {
              finalResponse = { content: routingResult.content }
            }

            // Converti in markdown e invia
            const formattedResponse = convertToMarkdown(finalResponse.content)

            // Aggiungiamo la risposta alla history locale
            history.push({
              role: "assistant",
              content: formattedResponse,
            })

            await sendWhatsAppMessage(message.from, formattedResponse)
            logMessage("SENT", "Risposta inviata", {
              response: formattedResponse.substring(0, 50) + "...",
              processingTime: `${
                (new Date().getTime() - startTime.getTime()) / 1000
              } sec`,
            })
          } catch (error) {
            logMessage(
              "ERROR",
              "Errore nell'elaborazione del messaggio bottone",
              error
            )
            await sendWhatsAppMessage(
              message.from,
              "Mi dispiace, si è verificato un errore nell'elaborazione della tua richiesta. Riprova più tardi."
            )
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

// Funzione per processare il messaggio con il chatbot principale e determinare il routing
async function processWithMainChatbot(
  message: string,
  promptData: any,
  history?: any[]
) {
  try {
    logMessage("INFO", "Processando con il chatbot principale")

    // Ottieni direttamente la risposta dal modello LLM
    const mainResponse = await getLLMResponse(message, promptData, history)

    // Determina il target dal contenuto della risposta
    let target
    try {
      // Prova a estrarre il target dal JSON
      if (
        mainResponse.content.includes('"target": "Orders"') ||
        mainResponse.content.includes('"target":"Orders"') ||
        message.toLowerCase().includes("ordine") ||
        message.toLowerCase().includes("ordini") ||
        message.toLowerCase().includes("ultimo ordine")
      ) {
        target = "orders"
      } else if (
        mainResponse.content.includes('"target": "Products"') ||
        mainResponse.content.includes('"target":"Products"') ||
        message.toLowerCase().includes("prodotto") ||
        message.toLowerCase().includes("prodotti")
      ) {
        target = "products"
      } else if (
        mainResponse.content.includes('"target": "Sales"') ||
        mainResponse.content.includes('"target":"Sales"') ||
        message.toLowerCase().includes("vendita") ||
        message.toLowerCase().includes("acquisto")
      ) {
        target = "sales"
      } else {
        target = determineTarget(mainResponse.content)
      }
    } catch (err) {
      // In caso di errore, usa il metodo standard
      target = determineTarget(mainResponse.content)
    }

    logMessage("INFO", `Target determinato: ${target || "nessun target"}`)

    // Se il target è orders, products o sales ma non c'è un sub-chatbot configurato,
    // restituiamo una risposta predefinita
    if (target && !targetConfigs[target]) {
      let content = ""
      if (target === "orders") {
        content =
          "Per visualizzare i dettagli del tuo ultimo ordine con L'Altra Italia, avrai bisogno di accedere al tuo account sul nostro sito web. Al momento non posso visualizzare direttamente i dettagli degli ordini tramite WhatsApp. Posso aiutarti con altre informazioni sui nostri prodotti gastronomici mediterranei?"
      } else if (target === "products") {
        content =
          "L'Altra Italia offre una vasta gamma di prodotti gastronomici mediterranei e italiani. Puoi visitare il nostro sito web per vedere il catalogo completo o chiedermi informazioni su categorie specifiche."
      } else if (target === "sales") {
        content =
          "Siamo felici che tu sia interessato ai prodotti gastronomici de L'Altra Italia. Posso fornirti informazioni generali sulle vendite o metterti in contatto con un nostro consulente."
      }

      if (content) {
        return {
          content: content,
          target: target,
        }
      }
    }

    // Estrai il contenuto effettivo dal JSON se possibile
    let responseContent = mainResponse.content

    // Prima prova a fare il parsing del JSON
    try {
      const parsedResponse = JSON.parse(mainResponse.content)
      if (parsedResponse.content) {
        responseContent = parsedResponse.content
      } else if (parsedResponse.message) {
        responseContent = parsedResponse.message
      } else if (parsedResponse.response) {
        responseContent = parsedResponse.response
      } else if (parsedResponse.text) {
        responseContent = parsedResponse.text
      }
    } catch {
      // Se non è JSON valido, prova altre strategie
      if (mainResponse.content.includes("```json")) {
        // Se contiene un blocco JSON in markdown, prova a estrarre il testo dopo il blocco JSON
        const parts = mainResponse.content.split("```")
        if (parts.length >= 3) {
          const textAfterJson = parts.slice(2).join("```").trim()
          if (textAfterJson.length > 0) {
            responseContent = textAfterJson
          }
        }
      }
    }

    // Se la risposta è ancora in JSON, imposta una risposta predefinita in base al target
    if (
      responseContent.trim().startsWith("{") &&
      responseContent.includes('"target":')
    ) {
      if (target === "orders") {
        responseContent =
          "Per visualizzare i dettagli dei tuoi ordini con L'Altra Italia, potresti dover accedere al tuo account sul nostro sito web. Al momento, posso fornirti solo informazioni generali."
      } else if (target === "products") {
        responseContent =
          "L'Altra Italia offre una selezione di prodotti gastronomici mediterranei e italiani di alta qualità. Quale categoria ti interessa di più?"
      } else if (target === "sales") {
        responseContent =
          "Grazie per il tuo interesse nei prodotti de L'Altra Italia. Posso fornirti informazioni sui nostri prodotti o metterti in contatto con un consulente. Cosa preferisci?"
      } else {
        responseContent =
          "Ciao! Come posso aiutarti oggi con i prodotti de L'Altra Italia?"
      }
    }

    return {
      content: responseContent,
      target: target,
    }
  } catch (error) {
    logMessage("ERROR", "Errore nel processing principale", error)
    return {
      content: "Mi dispiace, si è verificato un errore. Riprova più tardi.",
    }
  }
}

// Determina il target dal contenuto della risposta
function determineTarget(content: string): ValidTarget | undefined {
  try {
    // Prova a interpretare la risposta come JSON che contiene un campo "target"
    const response = JSON.parse(content)
    return response.target as ValidTarget
  } catch {
    // Se non può essere interpretato come JSON o se il target è Generic, restituisci "general" come fallback
    try {
      // Verifica se contiene la stringa "target": "Generic"
      if (content.includes('"target": "Generic"')) {
        return "general"
      }
    } catch {}
    // Se non può essere interpretato, restituisce undefined
    return undefined
  }
}

// Funzione per inviare il messaggio al sub-chatbot appropriato
async function routeToSubChatbot(
  target: ValidTarget,
  message: string,
  phoneNumber: string,
  history?: any[]
) {
  try {
    logMessage("INFO", `Routing al sub-chatbot: ${target}`)

    // Se il target è general, usa un messaggio di benvenuto diretto
    if (target === "general") {
      const lowerMessage = message.toLowerCase()
      // Risposte predefinite per messaggi comuni
      if (
        lowerMessage.includes("ciao") ||
        lowerMessage.includes("salve") ||
        lowerMessage.includes("buongiorno") ||
        lowerMessage.includes("buonasera")
      ) {
        return {
          content:
            "Ciao! Sono l'assistente virtuale de L'Altra Italia, specializzata in prodotti gastronomici mediterranei e italiani. Come posso aiutarti oggi?",
          target: target,
        }
      } else if (lowerMessage.includes("grazie")) {
        return {
          content:
            "Di nulla! Sono qui per aiutarti. C'è altro di cui hai bisogno?",
          target: target,
        }
      } else {
        // Ottieni il prompt principale
        const mainPromptData = await getPrompt(MAIN_PROMPT_ID)
        if (!mainPromptData) {
          throw new Error("Prompt principale non trovato")
        }

        // Per messaggi generici, usa un messaggio standard
        return {
          content:
            "Posso aiutarti con informazioni sui nostri prodotti gastronomici mediterranei e italiani, servizi, o rispondere alle tue domande. Di cosa vorresti parlare?",
          target: target,
        }
      }
    }

    // Se il target è orders, products o sales ma non esiste il prompt,
    // restituisci direttamente una risposta personalizzata
    if (
      (target === "orders" || target === "products" || target === "sales") &&
      (!targetConfigs[target] || !targetConfigs[target].promptId)
    ) {
      if (target === "orders") {
        return {
          content:
            "Per visualizzare i dettagli del tuo ultimo ordine con L'Altra Italia, avrai bisogno di accedere al tuo account sul nostro sito web ufficiale. Al momento non posso visualizzare direttamente i dettagli degli ordini tramite WhatsApp. Posso comunque aiutarti con informazioni generali sui nostri prodotti gastronomici mediterranei e italiani. C'è qualche categoria in particolare che ti interessa?",
          target: target,
        }
      } else if (target === "products") {
        return {
          content:
            "L'Altra Italia offre una vasta gamma di prodotti gastronomici mediterranei e italiani. Puoi visitare il nostro sito web per vedere il catalogo completo o chiedermi informazioni su categorie specifiche.",
          target: target,
        }
      } else if (target === "sales") {
        return {
          content:
            "Siamo felici che tu sia interessato ai prodotti gastronomici de L'Altra Italia. Posso fornirti informazioni generali sulle vendite o metterti in contatto con un nostro consulente.",
          target: target,
        }
      }
    }

    // Per altri target, continua con il comportamento normale
    // Ottieni la configurazione del target
    const targetConfig = targetConfigs[target]
    if (!targetConfig) {
      throw new Error(`Configurazione non trovata per il target ${target}`)
    }

    // Ottieni il prompt specifico per il target
    const promptData = await getPrompt(targetConfig.promptId)
    if (!promptData) {
      throw new Error(`Prompt non trovato per il target ${target}`)
    }

    // Ottieni la risposta dal modello LLM specializzato
    const targetResponse = await getLLMResponse(message, promptData, history)
    logMessage("INFO", `Risposta ricevuta dal sub-chatbot ${target}`)

    /* FORMATTAZIONE COMMENTATA COME RICHIESTO
    // IMPORTANTE: Riprocessa la risposta attraverso il chatbot principale per formattazione
    const mainPromptData = await getPrompt(MAIN_PROMPT_ID)
    if (!mainPromptData) {
      // Se non riusciamo a ottenere il prompt principale, restituisci direttamente la risposta del target
      return {
        content: targetResponse.content,
        target: target,
      }
    }

    // Invia la risposta del target al Main per il formatting finale
    logMessage("INFO", "Formattando risposta finale con Main chatbot")
    const finalResponse = await getLLMResponse(
      `Formatta questa risposta in markdown: ${targetResponse.content}`,
      mainPromptData,
      history
    )

    return {
      content: finalResponse.content,
      target: target,
    }
    */

    // Estrai il contenuto dal JSON anche qui se possibile
    let responseContent = targetResponse.content
    try {
      const parsedResponse = JSON.parse(targetResponse.content)
      if (parsedResponse.content) {
        responseContent = parsedResponse.content
      } else if (parsedResponse.message) {
        responseContent = parsedResponse.message
      } else if (parsedResponse.response) {
        responseContent = parsedResponse.response
      }
    } catch {
      // Se non è JSON valido, usa il contenuto originale
    }

    return {
      content: responseContent,
      target: target,
    }
  } catch (error) {
    logMessage("ERROR", `Errore nel routing al sub-chatbot ${target}`, error)

    // In caso di errore, invia una risposta specifica in base al target
    if (target === "orders") {
      return {
        content:
          "Per visualizzare i dettagli del tuo ultimo ordine con L'Altra Italia, avrai bisogno di accedere al tuo account sul nostro sito web. Al momento non posso visualizzare direttamente i dettagli degli ordini tramite WhatsApp. Posso aiutarti con altre informazioni sui nostri prodotti gastronomici mediterranei?",
        target: target,
      }
    } else if (target === "products") {
      return {
        content:
          "L'Altra Italia offre una vasta gamma di prodotti gastronomici mediterranei e italiani. Puoi visitare il nostro sito web per vedere il catalogo completo o chiedermi informazioni su categorie specifiche.",
        target: target,
      }
    } else if (target === "sales") {
      return {
        content:
          "Siamo felici che tu sia interessato ai prodotti gastronomici de L'Altra Italia. Posso fornirti informazioni generali sulle vendite o metterti in contatto con un nostro consulente.",
        target: target,
      }
    } else {
      // Messaggio generico per altri target
      return {
        content:
          "Mi dispiace, ma al momento non posso elaborare questa richiesta. Riprova più tardi.",
        target: "general",
      }
    }
  }
}

// Funzione per inviare messaggi WhatsApp
async function sendWhatsAppMessage(to: string, message: string) {
  try {
    logMessage("SENDING", `Invio messaggio a ${to}`, {
      messagePreview:
        message.substring(0, 50) + (message.length > 50 ? "..." : ""),
    })

    const response = await axios.post(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: message },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    )

    logMessage("SUCCESS", "Messaggio inviato con successo", {
      wamid: response.data.messages?.[0]?.id,
    })
    return response.data
  } catch (error: any) {
    logMessage("ERROR", "Errore nell'invio del messaggio", {
      message: error.message,
      status: error.response?.status,
      errorData: error.response?.data,
    })
    throw error
  }
}

// Funzione per inviare il messaggio di benvenuto
export async function sendWelcomeMessage(to: string, name: string) {
  try {
    logMessage("SENDING", `Invio messaggio di benvenuto a ${name}`, { to })

    // Ottieni il prompt predefinito
    const promptData = await getPrompt(MAIN_PROMPT_ID)
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
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
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
