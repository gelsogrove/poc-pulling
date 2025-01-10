// extract_entities.ts

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
      key
    ] = `${personalizedSensitiveDataMap[key]}_${conversationId}`
  })

  const regex = new RegExp(
    Object.keys(personalizedSensitiveDataMap).join("|"),
    "g"
  )
  return inputString.replace(regex, (match) => {
    return personalizedSensitiveDataMap[match]
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
      return [value + `_${conversationId}`, key] // Rimuoviamo il suffisso del conversationId
    })
  )

  const regex = new RegExp(Object.keys(reverseMap).join("|"), "g")
  return inputString.replace(regex, (match) => {
    return reverseMap[match]
  })
}
