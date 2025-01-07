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

/**
 * Funzione per ripristinare i valori originali nel testo,
 * sostituendo i "fake values" con quelli reali.
 *
 * @param content Il testo da modificare
 * @param formattedEntities Le entità con i valori originali e fake
 * @param reverse Flag per decidere se sostituire i fake values con quelli reali
 * @returns Il testo modificato
 */
export const replaceValuesInText = (
  content: string,
  formattedEntities: { entity: string; value: string; fakevalue: string }[],
  reverse = false
): string => {
  let modifiedText = content

  // Loop su tutte le entità per fare la sostituzione
  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim() // Se reverse, usa il fake value
    const replacement = reverse ? String(value) : String(fakevalue) // Se reverse, sostituisci con il valore originale

    // Escapes i caratteri speciali per uso in regex
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}\\b`, "g")

    // Sostituisci i valori nel testo
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
