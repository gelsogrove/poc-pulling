import axios from "axios"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY =
  "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"
const YOUR_SITE_URL = "https://yoursite.com" // Modifica con il tuo sito (opzionale)
const YOUR_SITE_NAME = "Your Site Name" // Modifica con il nome del tuo sito (opzionale)

const testEndpoint = async () => {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: "mistralai/mixtral-8x7b-instruct", // Modifica con il modello che vuoi utilizzare
        messages: [
          { role: "user", content: "Hello" }, // Messaggi per il completamento
        ],
        provider: {
          order: ["OpenAI", "Together"], // Modifica secondo la documentazione
        },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": YOUR_SITE_URL,
          "X-Title": YOUR_SITE_NAME,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    )

    console.log("Response from OpenRouter:", response.data)
  } catch (error) {
    console.error("Error reaching the OpenRouter API:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })
  }
}

testEndpoint()
