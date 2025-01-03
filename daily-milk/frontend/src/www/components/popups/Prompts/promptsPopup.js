import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Modalità per il linguaggio
import "codemirror/theme/dracula.css" // Tema dell'editor
import Cookies from "js-cookie" // Per gestire i cookie
import React, { useEffect, useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import "./PromptsPopup.css" // Stili personalizzati
import { getPrompt, postPrompt } from "./api/PromptsApi" // Funzioni API

const PromptsForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    introduction: "",
  })

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const token = Cookies.get("token")
        const prompt = await getPrompt(token)
        console.log("Prompt fetched:", prompt)
        setFormData((prevData) => ({
          ...prevData,
          introduction: prompt.content || "",
        }))
      } catch (error) {
        console.error("Errore durante il recupero del prompt:", error)
      }
    }

    fetchPrompt()
  }, [])

  const handleEditorChange = (name) => (editor, data, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    try {
      const token = Cookies.get("token")
      await postPrompt(formData.introduction, token)
      console.log("Prompt inviato con successo")
      onClose()
    } catch (error) {
      console.error("Errore durante l'invio del prompt:", error)
    }
  }

  console.log("Form Data:", formData) // Debug dello stato del form

  return (
    <div className="prompts-form-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      <h3 className="title">Prompt Composer</h3>
      <div className="form-section">
        <div className="editor-height">
          <ControlledEditor
            className="codemirror-editor"
            value={formData.introduction || ""}
            onBeforeChange={handleEditorChange("introduction")}
            options={{
              lineNumbers: true,
              mode: "json", // Cambia il linguaggio se necessario
              theme: "dracula", // Tema scelto
              lineWrapping: true,
              scrollbarStyle: "native", // Stile della scrollbar
              viewportMargin: Infinity, // Migliora la gestione dello scrolling
            }}
          />
        </div>
      </div>

      <button type="submit" className="submit-button" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  )
}

export default PromptsForm
