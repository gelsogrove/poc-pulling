import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Modalità per il linguaggio
import "codemirror/theme/dracula.css" // Tema dell'editor
import Cookies from "js-cookie"
import React, { useEffect, useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import "./PromptsPopup.css"
import { getPrompt, postPrompt } from "./api/PromptsApi"

const PromptsForm = ({ idPrompt, onClose }) => {
  const [formData, setFormData] = useState({
    content: "",
    temperature: 0.5,
    model: "",
  })
  const [isChanged, setIsChanged] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const token = Cookies.get("token")
        const prompt = await getPrompt(idPrompt, token)
        setFormData((prevData) => ({
          ...prevData,
          content: prompt.prompt || "ddd",
          model: prompt.model || "",
          temperature: parseFloat(prompt.temperature) || 0.5,
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
    setIsChanged(true)
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
    setIsChanged(true)
  }

  const handleSliderChange = (event) => {
    setFormData((prevData) => ({
      ...prevData,
      temperature: parseFloat(event.target.value), // Converte il valore in numero
    }))
    setIsChanged(true)
  }

  const handleSubmit = async () => {
    if (isLoading) return // Previene clic multipli durante il caricamento
    setIsLoading(true) // Attiva il loader

    const startTime = Date.now() // Segna l'inizio della chiamata
    try {
      const token = Cookies.get("token")
      await postPrompt(
        formData.content,
        formData.model,
        formData.temperature,
        idPrompt,
        token
      )
      console.log("Prompt inviato con successo")

      // Calcola il tempo rimanente per raggiungere 3 secondi
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(1500 - elapsedTime, 0)

      setTimeout(() => {
        setIsLoading(false)
      }, remainingTime)
    } catch (error) {
      console.error("Errore durante l'invio del prompt:", error)
      setIsLoading(false) // Riattiva il pulsante in caso di errore
    }
  }

  return (
    <div className="prompts-form-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      {/* Sezione titolo + campi + pulsante Save */}
      <div className="header-row">
        <h3 className="title">Prompt Composer</h3>
        <div className="fields-container">
          <div className="form-section">
            <label className="form-label">Model</label>
            <select
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className="model-select"
            >
              <option value="" disabled>
                Select a model
              </option>
              <option value="openai/chatgpt-4o-latest">
                openai/chatgpt-4o-latest
              </option>

              <option value="openai/gpt-4o">openai/gpt-4o</option>
              <option value="openai/gpt-4o">google/gemini-pro-vision</option>
              <option value="openai/gpt-4o-mini">openai/gpt-4o-mini</option>
              <option value="openai/gpt-3.5-turbo">openai/gpt-3.5-turbo</option>
            </select>
          </div>

          <div className="form-section">
            <label className="form-label">
              Temperature:{" "}
              <span>{Number(formData.temperature).toFixed(2)}</span>
            </label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature}
              onChange={handleSliderChange}
              className="temperature-slider"
            />
          </div>
          <button
            type="submit"
            className="save-button"
            onClick={handleSubmit}
            disabled={!isChanged || isLoading}
          >
            {isLoading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="editor-container">
        <ControlledEditor
          className="codemirror-editor"
          value={formData.content || ""}
          onBeforeChange={handleEditorChange("content")}
          options={{
            lineNumbers: true,
            mode: "json",
            theme: "dracula",
            lineWrapping: true,
            scrollbarStyle: "native",
            viewportMargin: Infinity,
          }}
        />
      </div>
    </div>
  )
}

export default PromptsForm
