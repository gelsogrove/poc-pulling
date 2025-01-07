import nlp from "compromise"

// Funzione per generare un valore fittizio (nome di supereroe o città italiana)
export const generateFakeValue = (entity: string, value: string): string => {
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
    "New York",
    "Boston",
    "Miami",
    "Ibiza",
    "Sardegna",
    "Paris",
    "London",
    "Melburne",
  ]

  switch (entity) {
    case "people":
      return superheroNames[Math.floor(Math.random() * superheroNames.length)] // Scegli un nome casuale da supereroi
    case "places":
      return italianCities[Math.floor(Math.random() * italianCities.length)] // Scegli una città italiana casuale
    default:
      return value // Per altre entità, restituiamo il valore originale
  }
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
    value = people[0] // Imposta il valore originale come il primo risultato trovato
    fakevalue = generateFakeValue(entity, value) // Genera un nome fittizio per "people"
  }

  // Riconoscimento dinamico di entità come luoghi
  const places = doc.places().out("array")
  if (places.length > 0) {
    entity = "places"
    value = places[0] // Imposta il valore originale come il primo risultato trovato
    fakevalue = generateFakeValue(entity, value) // Genera una città fittizia per "places"
  }

  return { entity, value, fakevalue }
}

// Funzione per sostituire i valori fake nel testo
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

    modifiedText = modifiedText.replace(regex, replacement)
  })

  return modifiedText
}

// Funzione principale per processare i messaggi dinamicamente
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
      value,
      fakevalue,
    })

    // Sostituisce solo l'entità con il fakevalue, non l'intero messaggio
    const modifiedContent = replaceValuesInText(message.content, [
      { value: message.content, fakevalue: fakevalue },
    ])

    fakeMessages.push({
      role: message.role,
      content: modifiedContent,
    })
  })

  return { fakeMessages, formattedEntities }
}
