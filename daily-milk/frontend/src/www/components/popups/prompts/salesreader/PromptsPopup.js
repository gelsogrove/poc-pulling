/* eslint-disable react-hooks/exhaustive-deps */
import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Modalità per il linguaggio
import "codemirror/theme/dracula.css" // Tema dell'editor
import Cookies from "js-cookie"
import React, { useEffect, useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import CloseButton from "../../../share/CloseButton"
import "./PromptsPopup.css"
import { getPrompt, postPrompt } from "./api/PromptsApi"

const PromptsForm = ({ idPrompt, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    content: "",
    temperature: 0.5,
    model: "",
    promptname: "",
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
          promptname: prompt.promptname || "",
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
        token
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
              <option value="openai/chatgpt-4o-latest">
                OpenAI ChatGPT-4o Latest
              </option>
              <option value="openai/gpt-4o">OpenAI GPT-4o</option>
              <option value="google/gemini-pro-vision">
                Google Gemini Pro Vision
              </option>
              <option value="deepseek/deepseek-r1-distill-qwen-32b">
                deepseek/deepseek-r1-distill-qwen-32b
              </option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="openai/gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
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
