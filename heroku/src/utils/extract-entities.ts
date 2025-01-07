import { faker } from "@faker-js/faker"
import nlp from "compromise"

// Funzione per processare i messaggi dinamicamente
export const processMessages = (
  messages: { role: string; content: string }[]
): { fakeMessages: any[]; formattedEntities: any[] } => {
  const formattedEntities: any[] = []
  const fakeMessages: any[] = []

  // Elabora ciascun messaggio
  messages.forEach((message) => {
    // Estrazione dinamica delle entità dal contenuto del messaggio
    const { fakevalue, entity, value } = processEntities(message.content)

    formattedEntities.push({
      entity,
      value: value, // valore originale (es. Andrea Gelsomino)
      fakevalue: fakevalue, // valore falso (es. Jon Doe)
    })

    // Sostituisce solo l'entità con il fakevalue, non l'intero messaggio
    const modifiedContent = replaceValuesInText(message.content, [
      { value: value, fakevalue: fakevalue },
    ])

    fakeMessages.push({
      role: message.role,
      content: modifiedContent,
    })
  })

  return { fakeMessages, formattedEntities }
}

// Funzione per processare le entità nel contenuto dinamicamente
export const processEntities = (
  content: string
): { entity: string; value: string; fakevalue: string } => {
  let entity = ""
  let value = content // Partiamo dal valore originale
  let fakevalue = content // Se non c'è un'entità, restituiamo il contenuto originale

  const doc = nlp(content)

  // Riconoscimento dinamico di entità come persone
  const people = doc.people().out("array")
  if (people.length > 0) {
    entity = "people"
    value = people.join(" ") // Uniamo nome e cognome in un'unica stringa
    fakevalue = faker.person.fullName() // Genera un nome falso
  }

  // Riconoscimento dinamico di entità come luoghi
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    value = places[0] // Imposta il valore originale come il primo risultato trovato
    fakevalue = faker.location.city() // Genera una città finta
  }

  return { entity, value, fakevalue } // Restituiamo entità, valore originale e valore falso
}

export const replaceValuesInText = (
  content: string,
  formattedEntities: any[],
  reverse = false
): string => {
  let modifiedText = String(content) // Assicurati che content sia sempre una stringa.

  // Mantenere un mapping tra i valori finti e quelli originali
  const nameMapping = formattedEntities.reduce((acc, { value, fakevalue }) => {
    acc[fakevalue] = value // Aggiungiamo il mapping: nome finto -> nome originale
    return acc
  }, {})

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim()
    const replacement = reverse ? String(value) : String(fakevalue)

    // Regex migliorata per gestire punteggiatura opzionale e interi nomi
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}\\b`, "g")

    // Se "reverse" è true, sostituiamo il nome finto con quello originale
    if (reverse && nameMapping[original]) {
      console.log(`Sostituisco ${original} con ${nameMapping[original]}`)
      modifiedText = modifiedText.replace(regex, nameMapping[original])
    } else {
      modifiedText = modifiedText.replace(regex, replacement)
    }
  })

  return modifiedText
}
