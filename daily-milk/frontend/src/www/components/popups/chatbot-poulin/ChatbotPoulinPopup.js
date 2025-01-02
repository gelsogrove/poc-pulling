import React, { useState } from "react"
import ChatPoulin from "../../chatbots/chat-poulin/ChatPoulin"
import "./ChatbotPoulinPopup.css"

const ChatbotPoulinPopup = ({ onClose }) => {
  const [openPanel, setOpenPanel] = useState(false) // Usa useState per gestire lo stato del pannello

  const onTogglePanel = () => {
    setOpenPanel((prev) => !prev) // Cambia lo stato del pannello
  }

  // Crea l'oggetto config
  const config = {
    title: "Generative AI ChatBot",
    filename: "./source/data.json",
    systemPrompt: `
Your role is to:
- Ask users clear and simple questions to narrow down their requests, such as "What product?" or "Which farm?".
- Use filtering options such as date ranges, specific customers, specific products, quantities, or prices.
- If users ask for top clients or top products, return the top 10 elements of the list with full details.
- Provide all responses in a discursive format not too long.
- For the important concepts, put them in UPPERCASE and in bold with the bold HTML tag.
- Communicate with kindness and clarity.

When asked for clients, respond with their full details, including names and relevant information

**Capabilities:**
- If the customer asks for top clients or top products, ask for the order: alphabetical or by revenue of the months or years
- Retrieve specific orders or clients or products
- Analyze top farms, top products, or aggregate totals (e.g., total quantities or total prices).
- Perform detailed filtering, such as "Orders from October 2024 for Ballard Acres Farm".
- If the user asks for TOP CLIENTS or PRODUCTS, please sort as default alphabetically.
- If the user asks for TOP CLIENTS or PRODUCTS, please filter by last year as default


**Note:**
- short and concise answers
- puoi mettermi in bold i numeri importanti
- Don’t always ask for confirmation. Extract the data and ask if they want to use any other filter.
- if user ask for statisticts returns statistics for top clients, top products top sellers based on quantity, and total sales price and month and ruturn a json object because i need to use it in the frontend for the charts
- also for the totale returns me a html table maybe you can add the year on the first column
- Item Number e Description sono identici mostra solo Description
- se l'utente chiede per quantity non c'e' bisogno di mostrare il prezzo
- se l'utente chiede per price non c'e' bisogno di mostrare la quantity
- le quantita puoi mettere il punto dopo le migliaia ? es 105965 > 10.5965

**OUTPUT**
- return the data in a html table format with header and body con una classe table-container table-header table-body
- mostra le colonne che ti chiede senza inventarsi altre
- is important that you return the data in a html table format please don't forget ! and there is no need to say herer you can see your html
- inviami td vuoti se non li trovo ma ho bisogno che ci siano altrimenti mi sballi
- NON DEVI MAI INVIARMI UNA TABELLA VUOTA CHE NON HA ELEMENTI SE ME LA INVII E' PERCHE' HA ALMENO UN TR nel TBODY
- Generate a single <table> element containing all rows in a single <tbody> for topics Ensure the table is not split into multiple <table> tags
- HTML well formed is the key of the response
- also for the statistics returns me a html table maybe you can add the year on the first column
- la quantity e' un numero intero es 17.400

    `,
    first_message: "Hello, how can I help you today?",
    first_options: [
      "I want to see the top Clients",
      "I want to see the top Products",
      "I want to see the top Sellers",
      "Provide me the statistics of the month",
      "Other",
      "Exit",
    ],
    error_message:
      "There was an error processing your request. Please try again.",
    goodbye_message: "Thank you. Goodbye!",
    max_tokens: 3500,
    temperature: 0.7,
    model: "gpt-4o-mini",
    ispay: true,
    server: "https://human-in-the-loops-688b23930fa9.herokuapp.com",
    local: "http://localhost:4999",
  }

  return (
    <div>
      <div className="chatbot-popup-poulin">
        <button
          className="visible-panel btn hover-effect"
          onClick={onTogglePanel}
        >
          {openPanel ? (
            <i class="fa-solid fa-arrow-right icon"></i>
          ) : (
            <i class="fa-solid fa-arrow-left icon"></i>
          )}
        </button>

        <button onClick={onClose} className="close-popup btn hover-effect">
          <i class="fa-solid fa-close icon"></i>
        </button>

        {/* Sezione Chat */}
        <div className="chat-section-source">
          <h3>Sales reader chatbot</h3>
          <ChatPoulin {...config} openPanel={openPanel} />
        </div>
      </div>
    </div>
  )
}

export default ChatbotPoulinPopup
