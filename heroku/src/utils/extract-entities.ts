import { faker } from "@faker-js/faker"
import nlp from "compromise"

// Plugin per aggiungere termini specifici a compromise
nlp.plugin({
  words: {
    año: "Date",
  },
})

// Funzione per normalizzare il testo
const normalizeText = (text: string): string => {
  return text
    .replace(/[\s,.!?;:"'`]+/g, " ")
    .trim()
    .toLowerCase()
}

// Funzione per generare valori fake normalizzati
const generateFakeValue = (entity: string, value: string): string => {
  switch (entity) {
    case "numbers":
      return faker.number.int({ min: 1, max: 9999 }).toString()
    case "people":
      return faker.person.fullName()
    default:
      return faker.word.sample()
  }
}

// Funzione per rimuovere duplicati
const removeDuplicates = (entities: { value: string; fakevalue: string }[]) => {
  const seen = new Set()
  return entities.filter(({ value }) => {
    const normalizedValue = normalizeText(value)
    if (seen.has(normalizedValue)) return false
    seen.add(normalizedValue)
    return true
  })
}

// Funzione per estrarre entità
export const processMessages = (
  messages: { role: string; content: string }[]
) => {
  let formattedEntities: {
    entity: string
    value: string
    fakevalue: string
  }[] = []

  const fakeMessages = messages.map((message) => {
    const text = message.content
    const entities = [
      {
        entity: "people",
        value: text,
        fakevalue: generateFakeValue("people", text),
      },
    ]

    formattedEntities = [...formattedEntities, ...removeDuplicates(entities)]

    return { ...message, content: text }
  })

  return { fakeMessages, formattedEntities }
}

// Funzione per sostituire valori fake con originali
export const replaceValuesInText = (
  text: string,
  formattedEntities: { value: string; fakevalue: string }[],
  reverse = false
): string => {
  let modifiedText = text

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? fakevalue : value
    const replacement = reverse ? value : fakevalue

    const normalizedOriginal = normalizeText(original)
    const regex = new RegExp(`\\b${normalizedOriginal}\\b`, "gi")

    if (!regex.test(normalizeText(modifiedText))) {
      console.warn(
        `Entità non trovata per sostituzione: "${original}". Testo corrente: "${modifiedText}"`
      )
    }

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}
