import axios from "axios"
import Cookies from "js-cookie"
import { v4 as uuidv4 } from "uuid"

// Ottiene il nome dell'utente dai cookie, con un valore di default "Guest"
export const getUserName = () => {
  const name = Cookies.get("name") || "Guest"
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

// Aggiorna messaggi e cronologia in base agli aggiornamenti forniti
export const updateChatState = (messages, conversationHistory, updates) => {
  const updatedMessages = [...messages]
  const updatedHistory = [...conversationHistory]

  updates.forEach(({ sender, content, role }) => {
    updatedMessages.push({ id: uuidv4(), sender, text: content })
    updatedHistory.push({ role, content })
  })

  return { updatedMessages, updatedHistory }
}

/**
 * Middleware che:
 * 1. Esegue la query SQL
 * 2. Aggiunge il risultato allo storico
 * 3. Re-invia lo storico al bot
 * 4. Aggiunge la nuova risposta del bot allo storico
 * 5. Ritorna lo storico finale
 */
export const middlewareSQL = async (
  apiUrl,
  sqlQuery,
  conversationHistory,
  conversationId
) => {
  // 1. Eseguiamo la query SQL
  const sqlApiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(
    sqlQuery
  )}`
  const sqlResponse = await axios.get(sqlApiUrl)

  // 2. Creiamo un messaggio di sistema con il risultato della query
  const sqlResultMessage = {
    role: "system",
    content: `ritorna la seguente lista in una tabella html con theader e tbody senza la proprieta sql : ${JSON.stringify(
      sqlResponse.data
    )}`,
  }

  // Aggiorniamo la cronologia
  const updatedHistory = [...conversationHistory, sqlResultMessage]

  // 3. Inviamo ora lo storico aggiornato all'endpoint del bot
  const finalBotResponse = await axios.post(apiUrl, {
    token: Cookies.get("token"),
    name: Cookies.get("name"),
    conversationId,
    messages: updatedHistory,
  })

  // 4. Prendiamo il testo finale che il bot ha restituito
  const finalBotMessage = {
    role: "assistant",
    content: finalBotResponse.data.message,
  }

  // 5. Aggiungiamo anche questo messaggio di risposta allo storico
  const finalUpdatedHistory = [...updatedHistory, finalBotMessage]

  // 6. Ritorniamo lo storico completo
  return finalUpdatedHistory
}

// Estrae un oggetto JSON da un messaggio formattato come stringa
export const extractJsonFromMessage = (message) => {
  try {
    const match = message.match(/(\{[\s\S]*?\})/)
    return match ? JSON.parse(match[1]) : message
  } catch {
    return message
  }
}

// Gestisce errori globali aggiornando i messaggi e la cronologia
export const handleError = (error, messages, conversationHistory) => {
  return updateChatState(messages, conversationHistory, [
    {
      sender: "bot",
      content: error.message || "An error occurred.",
      role: "assistant",
    },
  ])
}
