import { faker } from "@faker-js/faker"
import nlp from "compromise"

// Plugin per aggiungere termini specifici a compromise
nlp.plugin({
  words: {
    año: "Date", // Aggiungi termini specifici se necessario
  },
})

// Regex per riconoscere valori specifici
const phonePattern: RegExp =
  /\+?[0-9]{1,3}[-.\s]?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4,}(?:\s?[xX]\d+)?/g
const emailPattern: RegExp =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const datePattern: RegExp =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}\b/g
const namePattern: RegExp = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g // Regex per identificare manualmente nomi completi

// Tipo per la struttura delle entità
interface FormattedEntity {
  entity: string
  value: string
  fakevalue: string
}

// Estrazione delle entità
const extractEntities = (text: string): { [key: string]: string[] } => {
  const doc = nlp(text)

  const entities = {
    people: doc.people().out("array"),
    dates: text.match(datePattern) || [], // Gestisci il caso null con array vuoto
    email: text.match(emailPattern) || [], // Gestisci il caso null con array vuoto
    phone: text.match(phonePattern) || [], // Gestisci il caso null con array vuoto
    iban: text.match(/\b[A-Z]{2}\d{2}[A-Za-z0-9]{1,30}\b/g) || [], // Gestisci il caso null con array vuoto
    money: text.match(/\b\d+(?:\.\d{1,2})?\s?[A-Z]{3}\b/g) || [], // Gestisci il caso null con array vuoto
    numbers: doc.match("#Value").out("array"),
    places: doc.match("#Place").out("array"),
  }

  // Fallback per riconoscere nomi manualmente se compromise non li rileva
  if (entities.people.length === 0) {
    entities.people = text.match(namePattern) || []
  }

  console.log("Entità estratte:", entities) // Debug
  return entities
}

// Generazione dei valori finti per le entità
const generateFakeValue = (entity: string, value: string): string => {
  switch (entity) {
    case "people":
      return faker.person.fullName() // Nome fake
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
    case "numbers":
      return faker.number.int({ min: 1, max: 9999 }).toString() // Converti il numero in stringa
    case "places":
      return faker.location.city()
    default:
      return value
  }
}

// Funzione per sostituire i valori finti nel testo
export const replaceValuesInText = (
  text: string,
  formattedEntities: any[],
  reverse: boolean = false
): string => {
  let modifiedText = text

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim()
    const replacement = reverse ? String(value) : String(fakevalue)

    // Gestione della punteggiatura opzionale
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}\\b`, "g")

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}

// Funzione principale che elabora il testo
export const processMessages = (
  messages: { role: string; content: string }[]
): { fakeMessages: any[]; formattedEntities: FormattedEntity[] } => {
  const formattedEntities: FormattedEntity[] = []
  const fakeMessages: any[] = []

  messages.forEach((message) => {
    const { fakevalue, entity } = processEntities(message.content)

    // **Assicurati che l'oggetto contenga 'entity'**
    formattedEntities.push({
      entity: entity || "unknown", // Imposta un valore di fallback per 'entity' se non è definito
      value: message.content,
      fakevalue: fakevalue,
    })

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

// Funzione ausiliaria per estrarre entità (da utilizzare in processMessages)
const processEntities = (
  content: string
): { entity: string; fakevalue: string } => {
  let entity = ""
  let fakevalue = content // Default to original content

  // Use compromise to extract entities
  const doc = nlp(content)

  // Check for people entities
  const people = doc.people().out("array")
  if (people.length > 0) {
    entity = "people"
    fakevalue = faker.person.fullName() // Generate a fake name
  }

  // Check for place entities
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    fakevalue = faker.location.city() // Generate a fake city name
  }

  return { entity, fakevalue }
}

// Funzione per ripristinare il testo originale
export const restoreOriginalText = (
  fakeText: string,
  formattedEntities: FormattedEntity[]
): string => {
  return replaceValuesInText(fakeText, formattedEntities, true)
}
