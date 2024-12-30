const nlp = require("compromise")
const { faker } = require("@faker-js/faker")

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

// Funzione per estrarre entità generiche
const extractEntities = (text) => {
  const doc = nlp(text)

  const entities = {
    people: doc.people().out("array"),
    dates: text.match(datePattern),
    email: text.match(emailPattern),
    phone: text.match(phonePattern),
    iban: text.match(/\b[A-Z]{2}\d{2}[A-Za-z0-9]{1,30}\b/g),
    money: text.match(/\b\d+(?:\.\d{1,2})?\s?[A-Z]{3}\b/g),
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
const generateFakeValue = (entity, value) => {
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
      return faker.number.int({ min: 1, max: 9999 })
    case "places":
      return faker.location.city()
    default:
      return value
  }
}

// Funzione per sostituire i valori fake nella frase
const replaceValuesInText = (text, formattedEntities, reverse = false) => {
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

// Funzione principale
const processText = (inputText) => {
  const rawEntities = extractEntities(inputText)

  let formattedEntities = Object.entries(rawEntities).flatMap(
    ([entity, values]) =>
      (values || []).map((value) => ({
        entity,
        value: value.trim(),
        fakevalue: generateFakeValue(entity, value),
      }))
  )

  const fakeText = replaceValuesInText(inputText, formattedEntities)

  return { fakeText, formattedEntities }
}

// Funzione per ripristinare la frase originale
const restoreOriginalText = (fakeText, formattedEntities) => {
  return replaceValuesInText(fakeText, formattedEntities, true)
}

// Esempio di utilizzo
const input =
  "Give me Andrea Gelsomino that levas in Milan with orders  from 2024 who purchased the product POULING with a total order of 5,000 EUR."

const { fakeText, formattedEntities } = processText(input)
const originalText = restoreOriginalText(fakeText, formattedEntities)

console.log("Entità formattate:", formattedEntities)
console.log("************")
console.log("Frase con valori fake:", fakeText)
console.log("************")
console.log("Frase riconvertita:", originalText)
