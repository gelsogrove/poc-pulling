import { faker } from "@faker-js/faker"
import nlp from "compromise"

// Lista di città italiane (aggiungere altre città se necessario)
const italianCities = [
  "Roma",
  "Milano",
  "Napoli",
  "Torino",
  "Palermo",
  "Genova",
  "Bologna",
  "Firenze",
  "Bari",
  "Catania",
  "Verona",
  "Venezia",
  "Messina",
  "Padova",
  "Trieste",
  "Brescia",
  "Prato",
  "Parma",
  "Modena",
  "Reggio Calabria",
]

// Funzione per processare i messaggi dinamicamente
export const processMessages = (
  messages: { role: string; content: string }[]
): { fakeMessages: any[]; formattedEntities: any[] } => {
  const formattedEntities: any[] = []
  const fakeMessages: any[] = []

  messages.forEach((message) => {
    const { fakevalue, entity, value } = processEntities(message.content)

    if (value && fakevalue) {
      // Verifica che i valori siano validi
      formattedEntities.push({
        entity,
        value: value, // Salviamo il valore originale
        fakevalue: fakevalue,
      })

      // Sostituire solo l'entità con il fakevalue, non l'intero messaggio
      const modifiedContent = replaceValuesInText(message.content, [
        { value: value, fakevalue: fakevalue },
      ])

      fakeMessages.push({
        role: message.role,
        content: modifiedContent,
      })
    }
  })

  return { fakeMessages, formattedEntities }
}

// Funzione per processare le entità nel contenuto dinamicamente
export const processEntities = (
  content: string
): { entity: string; value: string; fakevalue: string } => {
  let entity = ""
  let value = content // Partiamo dal valore originale
  let fakevalue = content // Se non c'è un'entità, restituiamo il contenuto originale

  const doc = nlp(content)

  // Riconoscimento dinamico di entità come persone
  const people = doc.people().out("array")
  if (people.length > 0) {
    entity = "people"
    value = people[0] // Impostiamo il valore originale come il primo risultato trovato
    fakevalue = faker.person.fullName() // Genera un nome falso
  }

  // Riconoscimento dinamico di entità come luoghi (città)
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    value = places[0] // Impostiamo il valore originale come il primo risultato trovato
    fakevalue = faker.location.city() // Genera una città finta
  } else {
    // Se non riconosciamo la città con compromise, cerchiamo tra le città italiane predefinite
    const matchedCity = italianCities.find((city) => content.includes(city))
    if (matchedCity) {
      entity = "places"
      value = matchedCity
      fakevalue = faker.location.city() // Genera una città finta
    }
  }

  return { entity, value, fakevalue } // Restituiamo entità, valore originale e valore falso
}

// Funzione per generare la mappa per la sostituzione dei nomi e città
export const generateNameMap = (value: string, fakevalue: string) => {
  // Verifica se value o fakevalue sono vuoti o non validi
  if (!value || !fakevalue) return {}

  const valueParts = value.split(" ") // Dividiamo il valore originale (es. "Andrea Gelsomino")
  const fakeParts = fakevalue.split(" ") // Dividiamo il valore finto (es. "Jasmine Hintz")

  // Creiamo una mappa di sostituzioni
  const nameMap = {
    [`${valueParts[0]}`]: fakeParts[0], // Sostituisce solo il primo nome
    [`${valueParts[1]}`]: fakeParts[1], // Sostituisce solo il cognome
    [`${valueParts.join(" ")}`]: fakeParts.join(" "), // Sostituisce nome e cognome
  }

  return nameMap
}

// Funzione per sostituire i valori nel testo
export const replaceValuesInText = (
  content: string,
  formattedEntities: any[],
  reverse = false
): string => {
  let modifiedText = String(content) // Assicurati che content sia sempre una stringa.

  formattedEntities.forEach(({ value, fakevalue }) => {
    const nameMap = generateNameMap(value, fakevalue)

    // Se 'reverse' è true, dobbiamo sostituire il fakevalue con il value
    Object.keys(nameMap).forEach((key) => {
      const original = reverse ? nameMap[key] : key
      const replacement = reverse ? key : nameMap[key]

      // Controlla che original e replacement siano stringhe valide
      if (typeof original === "string" && typeof replacement === "string") {
        // Regex migliorata per gestire punteggiatura opzionale e interi nomi
        const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`\\b${escapedOriginal}\\b`, "g")

        modifiedText = modifiedText.replace(regex, replacement)
      }
    })
  })

  return modifiedText
}
