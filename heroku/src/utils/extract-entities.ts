import { faker } from "@faker-js/faker"
import nlp from "compromise"

// Funzione per estrarre entità generiche dal testo
export const extractEntities = (text: string) => {
  const doc = nlp(text)

  // Estrazione delle entità
  const entities: { [key: string]: string[] | null } = {
    people: doc.people().out("array"),
    dates: text.match(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}\b/g
    ),
    email: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g),
    phone: text.match(
      /\+?[0-9]{1,3}[-.\s]?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4,}(?:\s?[xX]\d+)?/g
    ),
    iban: text.match(/\b[A-Z]{2}\d{2}[A-Za-z0-9]{1,30}\b/g),
    money: text.match(/\b\d+(?:\.\d{1,2})?\s?[A-Z]{3}\b/g),
    numbers: doc.match("#Value").out("array"),
    places: doc.match("#Place").out("array"),
  }

  // Fallback per riconoscere nomi manualmente se compromise non li rileva
  if (entities.people?.length === 0) {
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
    entities.people = text.match(namePattern) || []
  }

  console.log("Entità estratte:", entities) // Debug
  return entities
}

// Funzione per generare valori fake per le entità
export const generateFakeValue = (entity: string, value: string): string => {
  switch (entity) {
    case "people":
      return faker.person.fullName() // Genera un nome falso
    case "dates":
      return faker.date.future().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    case "email":
      return faker.internet.email()
    case "phone":
      return faker.phone.number()
    case "iban":
      return faker.finance.iban()
    case "money":
      return `${faker.finance.amount()} ${faker.finance.currencyCode()}`

    case "places":
      return faker.location.city()
    default:
      return value
  }
}

// Funzione per sostituire le entità nel testo con i valori fake
export const replaceValuesInText = (
  content: string,
  formattedEntities: any[],
  reverse = false
): string => {
  let modifiedText = content

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim()
    const replacement = reverse ? String(value) : String(fakevalue)

    // Sostituire il valore nel testo usando regex
    const regex = new RegExp(`\\b${original}\\b`, "g")
    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}

// Funzione principale per processare i messaggi
export const processMessages = (
  messages: { role: string; content: string }[]
): { fakeMessages: any[]; formattedEntities: any[] } => {
  const formattedEntities: any[] = []
  const fakeMessages: any[] = []

  // Elabora ciascun messaggio
  messages.forEach((message) => {
    // Estrazione delle entità dal contenuto
    const { fakevalue, entity } = processEntities(message.content)

    formattedEntities.push({
      entity,
      value: message.content,
      fakevalue: fakevalue,
    })

    // Sostituire solo l'entità con il fakevalue
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

// Funzione per processare le entità (persone, luoghi, etc.)
export const processEntities = (
  content: string
): { entity: string; fakevalue: string } => {
  let entity = ""
  let fakevalue = content // Se non c'è un'entità, restituisci il contenuto originale

  const doc = nlp(content)

  // Riconoscimento dinamico di entità come persone
  const people = doc.people().out("array")
  if (people.length > 0) {
    entity = "people"
    fakevalue = faker.person.fullName() // Genera un nome falso
  }

  // Riconoscimento dinamico di entità come luoghi
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    fakevalue = faker.location.city() // Genera una città finta
  }

  return { entity, fakevalue }
}
