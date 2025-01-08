// Mappa dei dati sensibili e dei rispettivi token
const sensitiveDataMap: { [key: string]: string } = {
  "Andrea Gelsomino": "TOKEN_0001",
  Milano: "TOKEN_0001",
}

// Funzione per tokenizzare (sostituire i dati sensibili con i rispettivi token)
export function tokenize(inputString: string, conversationId: string): string {
  // Aggiungiamo conversationId al token per personalizzare
  const personalizedSensitiveDataMap = { ...sensitiveDataMap }
  Object.keys(personalizedSensitiveDataMap).forEach((key) => {
    personalizedSensitiveDataMap[
      key.toLowerCase() // Convertiamo la chiave in lowercase per il confronto
    ] = `${personalizedSensitiveDataMap[key]}_${conversationId}`
  })

  // Creiamo una regex con case-insensitivity
  const regex = new RegExp(
    Object.keys(personalizedSensitiveDataMap).map(escapeRegex).join("|"),
    "gi" // 'g' per sostituire globalmente, 'i' per ignorare maiuscole/minuscole
  )

  return inputString.replace(regex, (match) => {
    return personalizedSensitiveDataMap[match.toLowerCase()] // Confrontiamo in lowercase
  })
}

// Funzione per untokenizzare (ripristinare i dati sensibili dai token)
export function untokenize(
  inputString: string,
  conversationId: string
): string {
  // Rimuoviamo il conversationId dal token
  const reverseMap = Object.fromEntries(
    Object.entries(sensitiveDataMap).map(([key, value]) => {
      return [`${value}_${conversationId}`, key] // Manteniamo le chiavi nella forma originale
    })
  )

  // Creiamo una regex per i token
  const regex = new RegExp(
    Object.keys(reverseMap).map(escapeRegex).join("|"),
    "gi" // 'g' per sostituire globalmente, 'i' per ignorare maiuscole/minuscole
  )

  return inputString.replace(regex, (match) => {
    return reverseMap[match] // Non serve toLowerCase qui perché i token sono esatti
  })
}

// Funzione di utilità per gestire caratteri speciali nei regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
