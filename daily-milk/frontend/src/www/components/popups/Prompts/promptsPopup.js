import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Puoi usare un altro linguaggio se necessario
import "codemirror/theme/dracula.css" // Tema dell'editor
import React, { useEffect, useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import "./PromptsPopup.css"
import { getPrompt, postPrompt } from "./api/PromptsApi"

const PromptsForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    introduction: "",
  })

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const prompt = await getPrompt()
        setFormData((prevData) => ({
          ...prevData,
          introduction: prompt,
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
      await postPrompt(formData.introduction)
      const prompt = await getPrompt()
      console.log(prompt)
    } catch (error) {
      console.error("Errore durante l'invio del prompt:", error)
    }
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
            value={formData.introduction}
            onBeforeChange={handleEditorChange("introduction")}
            options={{
              lineNumbers: true,
              mode: "text",
              theme: "dracula",
            }}
          />
        </div>
      </div>

      <button type="submit" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  )
}

export default PromptsForm
