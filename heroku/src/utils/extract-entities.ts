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

// Definizione del tipo per le entità
interface FormattedEntity {
  entity: string
  value: string
  fakevalue: string
}

// Funzione per normalizzare i valori estratti
const normalizeValue = (value: string): string => {
  return value
    .replace(/[,`"'.]/g, "") // Rimuove caratteri indesiderati
    .trim() // Rimuove spazi
}

// Funzione per filtrare entità duplicate
const removeDuplicates = (entities: FormattedEntity[]): FormattedEntity[] => {
  const seen = new Set()
  return entities.filter(({ value }) => {
    const normalizedValue = normalizeValue(value)
    if (seen.has(normalizedValue)) {
      return false
    }
    seen.add(normalizedValue)
    return true
  })
}

// Funzione per estrarre entità generiche
const extractEntities = (text: string): FormattedEntity[] => {
  const doc = nlp(text)

  const entities: FormattedEntity[] = [
    ...doc
      .people()
      .out("array")
      .map((person) => ({
        entity: "people",
        value: normalizeValue(person),
        fakevalue: faker.person.fullName(),
      })),
    ...(text.match(emailPattern) || []).map((email) => ({
      entity: "email",
      value: normalizeValue(email),
      fakevalue: faker.internet.email(),
    })),
    ...(text.match(phonePattern) || []).map((phone) => ({
      entity: "phone",
      value: normalizeValue(phone),
      fakevalue: faker.phone.number(),
    })),
    ...(text.match(/\d+(\.\d+)?/g) || []).map((number) => ({
      entity: "numbers",
      value: normalizeValue(number),
      fakevalue: faker.number.int({ min: 1, max: 9999 }).toString(),
    })),
  ]

  return removeDuplicates(entities)
}

// Funzione per sostituire i valori fake nella frase
const replaceValuesInText = (
  text: string,
  formattedEntities: FormattedEntity[],
  reverse = false
): string => {
  let modifiedText = text

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? fakevalue : value
    const replacement = reverse ? value : fakevalue

    // Regex migliorata per gestire punteggiatura opzionale
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}\\b`, "g")

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}

// Funzione per elaborare un array di messaggi
export const processMessages = (
  apiMessages: { role: string; content: string }[]
): {
  fakeMessages: { role: string; content: string }[]
  formattedEntities: FormattedEntity[]
} => {
  let formattedEntities: FormattedEntity[] = []

  const fakeMessages = apiMessages.map((message) => {
    if (!message.content) return message

    const entities = extractEntities(message.content)
    formattedEntities = [...formattedEntities, ...entities]

    const fakeContent = replaceValuesInText(message.content, entities)

    return { ...message, content: fakeContent }
  })

  formattedEntities = removeDuplicates(formattedEntities)

  return { fakeMessages, formattedEntities }
}
