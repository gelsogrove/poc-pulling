import axios from "axios"
import { getLLMResponse } from "../getLLMresponse.js"

export type Target =
  | "Generic"
  | "Products"
  | "Orders"
  | "Logistic"
  | "Appointment"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
const OPENROUTER_HEADERS = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
}

/**
 * Ottiene la risposta dallo specialista per un dominio specifico
 */
export async function getSpecialistResponse(
  id: string,
  updatedHistory: any[],
  chatbot: string
) {
  const { user, content: specialistResponse } = await getLLMResponse(
    id,
    updatedHistory,
    chatbot
  )
  return { user, specialistResponse }
}

/**
 * Prepara il payload per la richiesta al coordinatore principale
 */
export function prepareFinalPayload(
  requestPayload: any,
  chatbot: string,
  specialistResponse: string
) {
  return {
    ...requestPayload,
    messages: [
      ...requestPayload.messages,
      {
        role: "system",
        content: `You are the main coordinator. A specialist ${chatbot} chatbot provided this response: "${specialistResponse}". 
                 Review, enhance, and ensure the response is coherent and complete. 
                 Maintain the same language as the original conversation.`,
      },
    ],
    response_format: { type: "text" },
  }
}

/**
 * Invia la richiesta al coordinatore e ottiene la risposta finale
 */
export async function getCoordinatorResponse(finalPayload: any) {
  const finalResponse = await axios.post(OPENROUTER_API_URL, finalPayload, {
    headers: OPENROUTER_HEADERS,
    timeout: 30000,
  })
  return finalResponse.data.choices[0]?.message?.content
}

/**
 * Aggiorna lo storico della conversazione
 */
export function updateConversationHistory(
  updatedHistory: any[],
  chatbot: string,
  specialistResponse: string,
  response: string,
  user: string
) {
  updatedHistory.push(
    {
      role: "system",
      content: `Specialist ${chatbot} response: ${specialistResponse}`,
    },
    { role: user, content: response, chatbot: "main" }
  )
  return updatedHistory
}

/**
 * Restituisce la configurazione del chatbot specialista
 */
export function getTargetConfig(target: Target) {
  const targetMap = {
    Generic: {
      id: "7e963d5d-ce8d-45ac-b3da-0d9642d580a8",
      chatbot: "Generic",
    },
    Products: {
      id: "94624adb-6c09-44c3-bda5-1414d40f04f3",
      chatbot: "Products",
    },
    Orders: {
      id: "a2a55acd-9db1-4ef3-a3f1-b745b7c0eaad",
      chatbot: "Orders",
    },
    Logistic: {
      id: "5abf1bd8-3ab1-4f8a-901c-a064cf18955c",
      chatbot: "Logistic",
    },
    Appointment: {
      id: "88858525-84de-41ea-8ae9-7e57ced9b03f",
      chatbot: "Appointment",
    },
  }

  return targetMap[target]
}
