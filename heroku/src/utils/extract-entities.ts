import { faker } from "@faker-js/faker"
import nlp from "compromise"

// Plugin per aggiungere termini specifici a compromise
nlp.plugin({
  words: {
    año: "Date",
  },
})

// Regex per riconoscere valori specifici
const phonePattern =
  /\+?[0-9]{1,3}[-.\s]?[0-9]{1,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4,}(?:\s?[xX]\d+)?/g
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const datePattern =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}\b/g
const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g // Regex per identificare manualmente nomi completi

// Definizione del tipo per le entità
interface Entities {
  people: string[]
  dates: string[] | null
  email: string[] | null
  phone: string[] | null
  iban: string[] | null
  money: string[] | null
  numbers: string[]
  places: string[]
}

// Definizione del tipo per le entità formattate
interface FormattedEntity {
  entity: string
  value: string
  fakevalue: string
}

// Funzione per estrarre entità generiche
const extractEntities = (text: string): Entities => {
  const doc = nlp(text)

  const entities: Entities = {
    people: doc.people().out("array"),
    dates: text.match(datePattern) || [],
    email: text.match(emailPattern) || [],
    phone: text.match(phonePattern) || [],
    iban: text.match(/\b[A-Z]{2}\d{2}[A-Za-z0-9]{1,30}\b/g) || [],
    money: text.match(/\b\d+(?:\.\d{1,2})?\s?[A-Z]{3}\b/g) || [],
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

// Generazione migliorata di valori fake
const generateFakeValue = (entity: string, value: string): string => {
  switch (entity) {
    case "people":
      return faker.person.fullName() // Nome fake generato
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
      return faker.number.int({ min: 1, max: 9999 }).toString()
    case "places":
      return faker.location.city()
    default:
      return value
  }
}

// Funzione per sostituire i valori fake nella frase
export const replaceValuesInText = (
  text: string,
  formattedEntities: FormattedEntity[],
  reverse = false
): string => {
  let modifiedText = text

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim()
    const replacement = reverse ? String(value) : String(fakevalue)

    // Regex migliorata per gestire punteggiatura opzionale
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}[.,!?;:]*`, "g")

    if (!regex.test(modifiedText)) {
      console.warn(`Entità non trovata per sostituzione: ${original}`)
    } else {
      console.info(`Entità sostituita: ${original} con ${replacement}`)
    }

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}

// Funzione per elaborare un array di messaggi e sostituire i valori con quelli fake
export const processMessages = (
  apiMessages: { role: string; content: string }[]
): {
  fakeMessages: { role: string; content: string }[]
  formattedEntities: FormattedEntity[]
} => {
  let formattedEntities: FormattedEntity[] = []

  // Itera su ogni messaggio per estrarre entità e generare valori fake
  const fakeMessages = apiMessages.map((message) => {
    if (!message.content) return message

    // Estrai le entità dal messaggio corrente
    const rawEntities = extractEntities(message.content)

    // Formatta le entità estratte
    const entities = Object.entries(rawEntities).flatMap(([entity, values]) =>
      (values || []).map((value: string) => ({
        entity,
        value: value.trim(),
        fakevalue: generateFakeValue(entity, value),
      }))
    )

    // Aggiungi le entità estratte alla lista globale
    formattedEntities = [...formattedEntities, ...entities]

    // Genera il messaggio con valori fake
    const fakeContent = replaceValuesInText(message.content, entities)

    return { ...message, content: fakeContent }
  })

  return { fakeMessages, formattedEntities }
}

// Funzione per ripristinare i valori originali in un array di messaggi
export const restoreOriginalMessages = (
  fakeMessages: { role: string; content: string }[],
  formattedEntities: FormattedEntity[]
): { role: string; content: string }[] => {
  return fakeMessages.map((message) => {
    if (!message.content) return message

    // Ripristina il contenuto originale usando le entità formattate
    const originalContent = replaceValuesInText(
      message.content,
      formattedEntities,
      true
    )

    return { ...message, content: originalContent }
  })
}
