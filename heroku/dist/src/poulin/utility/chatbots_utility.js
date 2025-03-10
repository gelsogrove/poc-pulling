import axios from "axios";
import dotenv from "dotenv";
import { pool } from "../../../server.js";
import { getLLMResponse } from "../chatbots/main/getLLMresponse.js";
dotenv.config();
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_HEADERS = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
};
export const getPrompt = async (idPrompt) => {
    try {
        const result = await pool.query("SELECT prompt, model, temperature FROM prompts WHERE idPrompt = $1", [idPrompt]);
        return result.rows.length > 0 ? result.rows[0] : null;
    }
    catch (error) {
        console.error("Error fetching prompt:", error);
        return null;
    }
};
export const cleanResponse = (responseText) => {
    // Rimuovi eventuali delimitatori Markdown come ```json e ```
    return responseText
        .replace(/^```json\s*/i, "") // Rimuove l'inizio ```json (case-insensitive)
        .replace(/```$/, "") // Rimuove i tre backticks finali
        .trim();
};
export const handleError = (error) => {
    if (axios.isAxiosError(error)) {
        // Qui sappiamo che error è un AxiosError, quindi ha proprietà come code, response, etc.
        console.error("Axios Error:", {
            message: error.message,
            code: error.code,
            response: error.response?.data || null,
            stack: error.stack,
        });
        if (error.code === "ECONNABORTED") {
            return { message: "Timeout, please try again later." };
        }
        else if (error.response) {
            const errorMessage = error.response.data?.message ||
                "OpenRouter error.";
            return { message: errorMessage };
        }
        else {
            return {
                message: "An unexpected error occurred. Please contact support if the issue persists.",
            };
        }
    }
    else if (error instanceof Error) {
        // Gestione per errori generici non Axios
        console.error("Generic Error:", {
            message: error.message,
            stack: error.stack,
        });
        return { message: error.message };
    }
    else {
        console.error("Unexpected error type:", error);
        return {
            message: "Unknown error. Please contact support if the problem persists.",
        };
    }
};
export const executeSqlQuery = async (sqlQuery) => {
    try {
        const sqlApiUrl = `https://ai.dairy-tools.com/api/sql.php?query=${encodeURIComponent(sqlQuery)}`;
        const sqlResult = await axios.get(sqlApiUrl);
        return sqlResult.data;
    }
    catch (error) {
        console.error("Error executing SQL query:", error);
        throw new Error("SQL execution failed");
    }
};
export const sendUsageData = async (day, price, service, triggerAction, userId, idPrompt) => {
    try {
        const query = "INSERT INTO usage (day, total, service,triggerAction, userId, idprompt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
        const values = [day, price, service, triggerAction, userId, idPrompt];
        const result = await pool.query(query, values);
        return result;
    }
    catch (error) {
        console.log(error);
        return error;
    }
};
export const generateDetailedSentence = async (model, sqlData, temperature, OPENROUTER_API_URL, OPENROUTER_HEADERS, userMessage) => {
    try {
        // Preparare il payload per OpenRouter
        const requestPayload = {
            model: "openai/gpt-3.5-turbo",
            messages: [
                { role: "user", content: userMessage },
                { role: "system", content: `Result: ${JSON.stringify(sqlData)}` },
                {
                    role: "user",
                    content: "Please summarize the result of the query repeating the question so it's more clear  in one sentence using the <b> for   important values if we are showing the moeny don't forget to put the $ char , AGGIUNGO ANCHE CHE I NUMERI DEVONO AVERE LE MIGLIAIA ES 2.676, please round if the numer is $674,342.60. show only $674,342",
                },
            ],
            max_tokens: 1000,
            temperature: Number(temperature),
        };
        // Chiamata ad OpenRouter
        const openaiResponse = await axios.post(OPENROUTER_API_URL, requestPayload, {
            headers: OPENROUTER_HEADERS,
            timeout: 30000,
        });
        // Pulire e verificare la risposta
        const rawResponse = cleanResponse(openaiResponse.data.choices[0]?.message?.content);
        if (!rawResponse) {
            console.error("Second pass: Empty response from OpenRouter.");
            return "Failed to generate a detailed sentence for the result.";
        }
        return rawResponse;
    }
    catch (error) {
        console.error("Error in generateDetailedSentence:", error);
        return "An error occurred while creating a detailed sentence for the result.";
    }
};
export async function getSpecialistResponse(id, updatedHistory, chatbot) {
    const { user, content: specialistResponse } = await getLLMResponse(id, updatedHistory, chatbot);
    return { user, specialistResponse };
}
export function prepareFinalPayload(requestPayload, chatbot, specialistResponse) {
    return {
        model: requestPayload.model,
        messages: [
            { role: "system", content: "Language: it" },
            { role: "system", content: "Language: es" },
            {
                role: "system",
                content: `You are the main coordinator. Respond in a natural, conversational way.
                 Never return JSON format responses.
                 Here is the specialist ${chatbot} response: "${specialistResponse}".
                 Format the response in a user-friendly way, maintaining the same language and adding appropriate greetings or context.
                 If the response contains a list, format it nicely with bullet points or numbers.`,
            },
            {
                role: "user",
                content: requestPayload.messages[requestPayload.messages.length - 1].content,
            },
        ],
        temperature: requestPayload.temperature,
        max_tokens: requestPayload.max_tokens,
        response_format: { type: "text" },
    };
}
export async function getCoordinatorResponse(finalPayload) {
    const finalResponse = await axios.post(OPENROUTER_API_URL, finalPayload, {
        headers: OPENROUTER_HEADERS,
        timeout: 30000,
    });
    return finalResponse.data.choices[0]?.message?.content;
}
export function getTargetConfig(target) {
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
    };
    return targetMap[target];
}
