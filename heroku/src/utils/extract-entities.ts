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
    const { fakevalue, entity } = processEntities(message.content)

    formattedEntities.push({
      entity,
      value: message.content,
      fakevalue: fakevalue,
    })

    // Sostituisce solo l'entità con il fakevalue, non l'intero messaggio
    const modifiedContent = replaceValuesInText(message.content, [
      { value: message.content, fakevalue: fakevalue },
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
): { entity: string; fakevalue: string } => {
  let entity = ""
  let fakevalue = content // Se non c'è un'entità, restituisci il contenuto originale

  // Uso di compromise per riconoscere entità nel testo
  const doc = nlp(content)

  // Riconoscimento dinamico di entità come persone
  const people = doc.people().out("array")
  if (people.length > 0) {
    entity = "people"
    fakevalue = faker.person.fullName() // Genera un nome finto
  }

  // Riconoscimento dinamico di entità come luoghi
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    fakevalue = faker.location.city() // Genera una città finta
  }

  return { entity, fakevalue }
}

// Funzione per sostituire i valori nel testo
export const replaceValuesInText = (
  content: string,
  formattedEntities: any[],
  reverse = false
): string => {
  let modifiedText = content

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim()
    const replacement = reverse ? String(value) : String(fakevalue)

    // Regex migliorata per gestire punteggiatura opzionale
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}[.,!?;:]*`, "g")

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}
