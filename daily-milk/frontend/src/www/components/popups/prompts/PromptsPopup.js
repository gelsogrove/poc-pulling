/* eslint-disable react-hooks/exhaustive-deps */
import "codemirror/lib/codemirror.css"
import "codemirror/mode/javascript/javascript"
import "codemirror/theme/dracula.css"
import Cookies from "js-cookie"
import React, { useEffect, useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import CloseButton from "../../share/CloseButton"
import "./PromptsPopup.css"
import { getModels, getPrompt, postPrompt } from "./api/PromptsApi.js"

const PromptsForm = ({ chatbotSelected, idPrompt, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    content: "",
    temperature: 0.5,
    model: "",
    promptname: "",
  })
  const [isChanged, setIsChanged] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState([])

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const token = Cookies.get("token")
        const prompt = await getPrompt(idPrompt, token, chatbotSelected)
        setFormData((prevData) => ({
          ...prevData,
          content: prompt.prompt || "ddd",
          model: prompt.model || "",
          temperature: parseFloat(prompt.temperature) || 0.5,
          promptname: prompt.promptname || "",
        }))
      } catch (error) {
        console.error("Errore durante il recupero del prompt:", error)
      }
    }

    const fetchModels = async () => {
      try {
        const token = Cookies.get("token")
        const modelsList = await getModels(token)
        setModels(modelsList)
      } catch (error) {
        console.error("Errore durante il recupero dei modelli:", error)
      }
    }

    fetchPrompt()
    fetchModels()
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

  const isFormValid = () => {
    return formData.promptname.trim() !== "" && isChanged
  }

  const handleSubmit = async () => {
    if (isLoading || !isFormValid()) return
    setIsLoading(true)

    const startTime = Date.now()
    try {
      const token = Cookies.get("token")
      await postPrompt(
        formData.content,
        formData.model,
        formData.temperature,
        idPrompt,
        formData.promptname,
        token,
        chatbotSelected
      )
      console.log("Prompt inviato con successo")

      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(1500 - elapsedTime, 0)

      setTimeout(() => {
        setIsLoading(false)
        if (onSave) onSave()
      }, remainingTime)
    } catch (error) {
      console.error("Errore durante l'invio del prompt:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="prompts-form-container">
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>

      {/* Sezione titolo + campi + pulsante Save */}
      <div className="header-row">
        <h3 className="title">Prompt Composer </h3>
        <div className="fields-container">
          <div className="form-section">
            <label className="form-label">Prompt Name</label>
            <input
              type="text"
              name="promptname"
              value={formData.promptname}
              onChange={handleInputChange}
              className={`promptname-input ${
                !formData.promptname.trim() ? "invalid" : ""
              }`}
              placeholder="Enter prompt name"
              required
            />
          </div>
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
              {models.map((model) => (
                <option key={model.id} value={model.model}>
                  {model.model}
                </option>
              ))}
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
              max="2"
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
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? "Saving..." : "Save prompt"}
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
