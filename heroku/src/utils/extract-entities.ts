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
  return value.replace(/[,`"'.]/g, "").trim()
}

// Funzione per generare valori fake normalizzati
const generateFakeValue = (entity: string, value: string): string => {
  switch (entity) {
    case "numbers":
      return normalizeValue(faker.number.int({ min: 1, max: 9999 }).toString())
    case "people":
      return normalizeValue(faker.person.fullName())
    case "places":
      return normalizeValue(faker.location.city())
    case "email":
      return normalizeValue(faker.internet.email())
    default:
      return normalizeValue(faker.word.sample())
  }
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

const extractEntities = (text: string): FormattedEntity[] => {
  const doc = nlp(text)

  const entities: FormattedEntity[] = [
    ...doc
      .people()
      .out("array")
      .map((person: string) => ({
        entity: "people",
        value: normalizeValue(person),
        fakevalue: generateFakeValue("people", person),
      })),
    ...(text.match(emailPattern) || []).map((email) => ({
      entity: "email",
      value: normalizeValue(email),
      fakevalue: generateFakeValue("email", email),
    })),
    ...(text.match(phonePattern) || []).map((phone) => ({
      entity: "phone",
      value: normalizeValue(phone),
      fakevalue: generateFakeValue("phone", phone),
    })),
    ...(text.match(/\d+(\.\d+)?/g) || []).map((number) => ({
      entity: "numbers",
      value: normalizeValue(number),
      fakevalue: generateFakeValue("numbers", number),
    })),
  ]

  return removeDuplicates(entities)
}

// Funzione per sostituire i valori fake nella frase
export const replaceValuesInText = (
  text: string,
  formattedEntities: FormattedEntity[],
  reverse = false
): string => {
  let modifiedText = text

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? fakevalue : value
    const replacement = reverse ? value : fakevalue

    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}(?=[.,!?;:]|\\s|$)`, "g")

    if (!regex.test(modifiedText)) {
      console.warn(
        `Entità non trovata per sostituzione: "${original}". Testo corrente: "${modifiedText}"`
      )
    }

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
