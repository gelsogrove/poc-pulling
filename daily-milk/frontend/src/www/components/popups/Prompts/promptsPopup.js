import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Puoi usare un altro linguaggio se necessario
import "codemirror/theme/dracula.css" // Tema dell'editor
import React, { useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import "./PromptsPopup.css"

const PromptsForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    introduction: "",
    target: "",
    limits: "",
    techincal: "",
    output: "",
    examples: "",
  })

  const handleEditorChange = (name) => (editor, data, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  return (
    <div className="prompts-form-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      <h3 className="title">Prompt composer</h3>
      <div className="form-section">
        <label htmlFor="introduzione">Your role is to:</label>
        <div className="editor-wrapper">
          <ControlledEditor
            className="codemirror-editor"
            value={formData.introduzione}
            onBeforeChange={handleEditorChange("introduzione")}
            options={{
              lineNumbers: true,
              mode: "text", // Modifica in base al linguaggio
              theme: "dracula", // Puoi scegliere il tema che preferisci
            }}
          />
        </div>
      </div>

      <div className="form-section">
        <label htmlFor="esempi">Examples</label>
        <ControlledEditor
          value={formData.esempi}
          onBeforeChange={handleEditorChange("esempi")}
          className="codemirror-editor"
          options={{
            lineNumbers: true,
            mode: "json",
            theme: "dracula",
            height: "300px",
          }}
        />
      </div>

      <button type="submit" onClick={() => alert("Prompt inviato!")}>
        Invia
      </button>
    </div>
  )
}

export default PromptsForm
