import nlp from "compromise"

// Funzione per generare un valore fittizio (nome di supereroe o città italiana)
const generateFakeValue = (entity: string, value: string): string => {
  const superheroNames = [
    "Superman",
    "Batman",
    "Spider-Man",
    "Wonder Woman",
    "Iron Man",
    "Captain America",
    "Hulk",
    "Thor",
    "Black Widow",
    "Black Panther",
    "Aquaman",
    "Doctor Strange",
    "Scarlet Witch",
    "Deadpool",
    "The Flash",
    "Green Lantern",
    "Ant-Man",
    "Hawkeye",
    "Wolverine",
    "Cyclops",
    "Storm",
    "Rogue",
    "Jean Grey",
    "Magneto",
    "Professor X",
  ]

  const italianCities = [
    "Roma",
    "Milano",
    "Napoli",
    "Torino",
    "Firenze",
    "Bologna",
    "Venezia",
    "Verona",
    "Genova",
    "Palermo",
  ]

  if (entity === "people") {
    return superheroNames[Math.floor(Math.random() * superheroNames.length)]
  } else if (entity === "places") {
    return italianCities[Math.floor(Math.random() * italianCities.length)]
  }

  return value
}

// Funzione per processare le entità nel contenuto dinamicamente
export const processEntities = (
  content: string
): { entity: string; fakevalue: string; value: string } => {
  let entity = ""
  let fakevalue = content // Se non c'è un'entità, restituiamo il contenuto originale
  let value = content // Partiamo dal valore originale

  const doc = nlp(content)

  // Riconoscimento dinamico di entità come persone
  const people = doc.people().out("array")
  if (people.length > 0) {
    entity = "people"
    value = people[0] // Valore originale trovato
    fakevalue = generateFakeValue("people", value) // Nome di supereroe
  }

  // Riconoscimento dinamico di entità come luoghi
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    value = places[0] // Valore originale trovato
    fakevalue = generateFakeValue("places", value) // Città italiana
  }

  return { entity, value, fakevalue }
}

// Funzione per processare i messaggi dinamicamente
export const processMessages = (
  messages: { role: string; content: string }[]
): { fakeMessages: any[]; formattedEntities: any[] } => {
  const formattedEntities: any[] = []
  const fakeMessages: any[] = []

  // Elabora ciascun messaggio
  messages.forEach((message) => {
    // Estrazione dinamica delle entità dal contenuto del messaggio
    const { fakevalue, entity, value } = processEntities(message.content)

    formattedEntities.push({
      entity,
      value, // Mantenere il valore originale per ogni entità
      fakevalue,
    })

    // Sostituisce solo l'entità con il fakevalue, non l'intero messaggio
    const modifiedContent = replaceValuesInText(message.content, [
      { value, fakevalue },
    ])

    fakeMessages.push({
      role: message.role,
      content: modifiedContent,
    })
  })

  return { fakeMessages, formattedEntities }
}

// Funzione per sostituire i valori nel testo
export const replaceValuesInText = (
  content: string,
  formattedEntities: any[],
  reverse = false
): string => {
  let modifiedText = content

  formattedEntities.forEach(({ value, fakevalue }) => {
    const original = reverse ? String(fakevalue) : String(value).trim()
    const replacement = reverse ? String(value) : String(fakevalue)

    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escapedOriginal}[.,!?;:]*`, "g")

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}
