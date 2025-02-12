import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import {
  createPrompt,
  deletePrompt,
  getModels,
  getPrompts,
  togglePromptActive,
} from "./api/promptmanager_api"
import PromptForm from "./component/PromptForm"
import "./PromptManager.css"

const PromptManager = ({ onClose }) => {
  const [prompts, setPrompts] = useState([])
  const [error, setError] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [newPrompt, setNewPrompt] = useState({
    promptname: "",
    model: "",
    temperature: 0.7,
    prompt: "",
  })
  const [models, setModels] = useState([])

  useEffect(() => {
    fetchPrompts()
    fetchModels()
  }, [])

  const fetchPrompts = async () => {
    try {
      const data = await getPrompts()
      setPrompts(data)
    } catch (err) {
      console.error("Error fetching prompts:", err)
    }
  }

  const fetchModels = async () => {
    try {
      const data = await getModels()
      setModels(data)
    } catch (err) {
      console.error("Error fetching models:", err)
    }
  }

  const handleDeletePrompt = async (prompt) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this prompt?"
    )
    if (confirmDelete) {
      try {
        await deletePrompt(prompt.idprompt)
        fetchPrompts()
        setErrorMessage("")
      } catch (err) {
        console.error("Error deleting prompt:", err)
        if (err.response?.status === 400) {
          setErrorMessage(err.response.data.error)
        }
      }
    }
  }

  const handleAddNewPrompt = () => {
    setShowForm(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewPrompt((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    try {
      await createPrompt(newPrompt)
      setShowForm(false)
      setNewPrompt({
        promptname: "",
        model: "",
        temperature: 0.7,
        prompt: "",
      })
      fetchPrompts()
    } catch (err) {
      console.error("Error creating prompt:", err)
      setError(err.response?.data?.error || "Error creating prompt")
    }
  }

  const handleToggleActive = async (prompt) => {
    try {
      await togglePromptActive(prompt.idprompt)
      fetchPrompts()
    } catch (err) {
      console.error("Error toggling prompt state:", err)
      setError(err.response?.data?.error || "Error updating prompt state")
    }
  }

  return (
    <div className="prompt-manager">
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>

      <div className="popup-title">
        <h2>Prompts</h2>
        <button className="add-button" onClick={handleAddNewPrompt}>
          Add
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {showForm ? (
        <PromptForm
          prompt={newPrompt}
          handleInputChange={handleInputChange}
          handleSave={handleSave}
          handleCancel={() => setShowForm(false)}
          models={models}
        />
      ) : (
        <table className="prompts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Model</th>
              <th>Temperature</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.idprompt}>
                <td>{prompt.promptname}</td>
                <td>{prompt.model}</td>
                <td>{prompt.temperature}</td>
                <td>
                  <button
                    onClick={() => handleToggleActive(prompt)}
                    className={`status-btn ${
                      prompt.isactive ? "active" : "inactive"
                    }`}
                  >
                    {prompt.isactive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => handleDeletePrompt(prompt)}
                    style={{ backgroundColor: "red" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PromptManager
