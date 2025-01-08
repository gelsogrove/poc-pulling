// app.ts

import { tokenize, untokenize } from "./extract_entities"

// Array di frasi
const frasi = [
  "Ciao, mi chiamo Andrea Gelsomino e vivo a Milano.",
  "Sono un sviluppatore software.",
  "Lavoro da remoto a tempo pieno.",
]

// ID univoco della conversazione
const conversationId = "abcd123fff4"

// Tokenizzazione: Applica la funzione `tokenize` su ogni frase dell'array, passando il conversationId
const tokenizedFrasi = frasi.map((frase) => tokenize(frase, conversationId))
console.log("Tokenized Frasi:", tokenizedFrasi)

// Untokenizzazione: Applica la funzione `untokenize` su ogni frase tokenizzata, passando il conversationId
const untokenizedFrasi = tokenizedFrasi.map((frase) =>
  untokenize(frase, conversationId)
)
console.log("Untokenized Frasi:", untokenizedFrasi)
