import axios from "axios"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_API_KEY =
  "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"

const testEndpoint = async () => {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: "google/gemini-2.0-flash-exp:free", // Modifica con il modello che vuoi utilizzare
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
