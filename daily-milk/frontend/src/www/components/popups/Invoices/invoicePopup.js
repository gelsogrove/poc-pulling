import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Puoi usare un altro linguaggio se necessario
import "codemirror/theme/dracula.css" // Tema dell'editor
import React from "react"
import "./invoicePopup.css"

const InvoicePopup = ({ onClose }) => {
  return (
    <div className="prompts-form-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h3>InvoicePopup </h3>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </div>
  )
}

export default InvoicePopup
