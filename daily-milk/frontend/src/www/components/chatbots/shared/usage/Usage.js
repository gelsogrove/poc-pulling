import React from "react"
import "./Usage.css"

const Usage = ({
  usageData,
  currentChatDifference,
  temperature,
  model,
  idPrompt,
  IdConversation,
  error,
}) => {
  // Se abbiamo un errore globale
  if (error) {
    return (
      <div className="error-message">
        <b>Error:</b>
        <br />
        {error}
      </div>
    )
  }

  // Se i dati usage non ci sono ancora
  if (!usageData) {
    return <div className="loading-message">Loading...</div>
  }

  // Se c’è un errore specifico nei dati usage
  if (usageData.error) {
    return (
      <div className="error-message">
        <b>Error:</b>
        <br />
        Request limit reached today :-(
      </div>
    )
  }

  return (
    <div className="usage-container">
      <div className="title-usage"></div>
      {/* Differenza calcolata */}
      <h3>{currentChatDifference.toFixed(2)} $</h3>
      <br />
      {/* Differenza calcolata */}
      Current monthly usage:
      <div>{usageData.totalCurrentMonthByChatbot} $</div>
      {/*  <hr />
      Current monthly usage:
      <div>{usageData.totalCurrentMonth} $</div>
      <hr />
    */}
      <hr />
      Model:
      <div>{model}</div>
      <hr />
      Temperature:
      <div>{temperature}</div>
      <hr />
      PromptId:
      <div>{idPrompt}</div>
      <hr />
      ConversationId:
      <div>{IdConversation}</div>
      <hr />
    </div>
  )
}

export default Usage
