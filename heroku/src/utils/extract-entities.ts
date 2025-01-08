// Array dei dati sensibili con rispettivi token
const sensitiveDataArray: { key: string; value: string }[] = [
  { key: "Andrea Gelsomino", value: "TOKEN_0001" },
  { key: "Milano", value: "TOKEN_0002" },
]

// Funzione per tokenizzare (sostituire i dati sensibili con i rispettivi token)
export function tokenize(inputString: string, conversationId: string): string {
  // Aggiungiamo conversationId al token per personalizzare
  const personalizedSensitiveDataArray = sensitiveDataArray.map((item) => ({
    key: item.key.toLowerCase(), // Convertiamo la chiave in lowercase per il confronto
    value: `${item.value}_${conversationId}`, // Aggiungiamo conversationId
  }))

  // Creiamo una regex con case-insensitivity
  const regex = new RegExp(
    personalizedSensitiveDataArray
      .map((item) => escapeRegex(item.key))
      .join("|"),
    "gi" // 'g' per sostituire globalmente, 'i' per ignorare maiuscole/minuscole
  )

  return inputString.replace(regex, (match) => {
    const found = personalizedSensitiveDataArray.find(
      (item) => item.key === match.toLowerCase()
    )
    return found ? found.value : match
  })
}

// Funzione per untokenizzare (ripristinare i dati sensibili dai token)
export function untokenize(
  inputString: string,
  conversationId: string
): string {
  // Rimuoviamo il conversationId dal token
  const reverseMap = Object.fromEntries(
    sensitiveDataArray.map((item) => [
      `${item.value}_${conversationId}`,
      item.key, // Manteniamo le chiavi nella forma originale
    ])
  )

  // Creiamo una regex per i token
  const regex = new RegExp(
    Object.keys(reverseMap).map(escapeRegex).join("|"),
    "g" // 'g' per sostituire globalmente
  )

  return inputString.replace(regex, (match) => {
    return reverseMap[match] // I token sono esatti
  })
}

// Funzione di utilità per gestire caratteri speciali nei regex
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
