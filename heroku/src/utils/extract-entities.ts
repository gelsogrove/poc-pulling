import { faker } from "@faker-js/faker"

// Funzione per estrarre le entità da una stringa di testo
const extractEntities = (text: string): { [key: string]: string[] } => {
  const entities: { [key: string]: string[] } = {
    people: [],
    dates: [],
    numbers: [],
    places: [], // Aggiunto il campo per le città/nazioni
  }

  // Regex per riconoscere entità comuni
  const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
  const datePattern =
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}\b/g
  const numberPattern = /\b\d+\b/g
  const placePattern = /\b(?:[A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g // Regex per città o nazioni

  // Estrazione delle entità
  entities.people = text.match(namePattern) || []
  entities.dates = text.match(datePattern) || []
  entities.numbers = text.match(numberPattern) || []
  entities.places = text.match(placePattern) || [] // Estrazione delle città/nazioni

  return entities
}

// Funzione per generare valori fake per le entità
const generateFakeValue = (entity: string, value: string): string => {
  switch (entity) {
    case "people":
      return faker.name.fullName() // Genera un nome falso
    case "dates":
      return faker.date.future().toLocaleDateString("en-US") // Genera una data futura
    case "numbers":
      return faker.datatype.number().toString() // Genera un numero casuale
    case "places":
      return faker.address.city() // Genera una città falsa
    default:
      return value
  }
}

// Funzione per processare i messaggi e sostituire le entità con valori fake
export const processMessages = (messages: any[]) => {
  const formattedEntities: any[] = [] // Qui memorizziamo le entità estratte
  const fakeMessages = messages.map((message) => {
    let content = message.content

    // Estrazione entità (per esempio persone, numeri, date, città/nazioni)
    const entities = extractEntities(content)

    // Aggiungi le entità al nostro array per successivo uso
    Object.entries(entities).forEach(([entity, values]) => {
      values.forEach((value) => {
        formattedEntities.push({
          entity,
          value,
          fakevalue: generateFakeValue(entity, value),
        })
      })
    })

    // Sostituire i valori reali con quelli fake
    formattedEntities.forEach(({ value, fakevalue }) => {
      content = content.replace(new RegExp(value, "g"), fakevalue)
    })

    // Restituisci il messaggio modificato
    return { ...message, content }
  })

  return { fakeMessages, formattedEntities }
}

// Aggiungi questa export per `replaceValuesInText` al termine del file
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

    if (!regex.test(modifiedText)) {
      console.warn(`Entità non trovata per sostituzione: ${original}`)
    } else {
      console.info(`Entità sostituita: ${original} con ${replacement}`)
    }

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}
