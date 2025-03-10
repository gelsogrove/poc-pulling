import axios from "axios";
import dotenv from "dotenv";
import { pool } from "../../server";
dotenv.config();
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
