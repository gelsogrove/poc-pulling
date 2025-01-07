import { faker } from "@faker-js/faker"

// Tipo delle entità da estrarre
interface Entity {
  entity: string
  value: string
  fakevalue: string
}

// Funzione per estrarre le entità dai messaggi
export const extractEntities = (messages: string[]): Entity[] => {
  const entities: Entity[] = []

  messages.forEach((message) => {
    // Esegui una ricerca per entità comuni (es. persone, numeri, date, luoghi)
    // Queste sono entità predefinite, ma puoi aggiungere altre logiche dinamiche
    // Per esempio, usando regex o altre librerie
    const people = message.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) // Per esempio, per estrarre nomi
    const numbers = message.match(/\b\d+\b/g) // Per estrarre numeri

    // Aggiungi le entità trovate
    if (people) {
      people.forEach((person) => {
        entities.push({
          entity: "people",
          value: person,
          fakevalue: faker.name.fullName(),
        })
      })
    }

    if (numbers) {
      numbers.forEach((number) => {
        entities.push({
          entity: "numbers",
          value: number,
          fakevalue: faker.datatype.number({ min: 1000, max: 9999 }).toString(),
        })
      })
    }
  })

  return entities
}

// Funzione per sostituire i valori delle entità nel testo
export const replaceValuesInText = (
  text: string,
  formattedEntities: Entity[],
  reverse = false
): string => {
  let modifiedText = text

  // Itera attraverso le entità per sostituire i valori
  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? fakevalue : value
    const replacement = reverse ? value : fakevalue

    // Escape dei caratteri speciali per evitare problemi nel regex
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}\\b`, "g")

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}

// Funzione per elaborare i messaggi e restituire sia i messaggi "falsi" che le entità formattate
export const processMessages = (
  messages: { role: string; content: string }[]
) => {
  const fakeMessages = messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  const formattedEntities = extractEntities(messages.map((msg) => msg.content))

  return {
    fakeMessages,
    formattedEntities,
  }
}
