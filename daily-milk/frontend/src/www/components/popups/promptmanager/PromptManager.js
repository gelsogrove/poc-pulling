import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import {
  createPrompt,
  deletePrompt,
  getModels,
  getPrompts,
  movePromptOrder,
  togglePromptActive,
  togglePromptHide,
} from "./api/promptmanager_api"
import PromptForm from "./component/PromptForm"
import "./PromptManager.css"

const PromptManager = ({ onClose }) => {
  const [prompts, setPrompts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newPrompt, setNewPrompt] = useState({
    promptname: "",
    model: "",
    temperature: 0.7,
    prompt: "",
    path: "",
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
      } catch (err) {
        console.error("Error deleting prompt:", err)
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
        path: "",
      })
      fetchPrompts()
    } catch (err) {
      console.error("Error creating prompt:", err)
    }
  }

  const handleToggleActive = async (prompt) => {
    try {
      await togglePromptActive(prompt.idprompt)
      fetchPrompts()
    } catch (err) {
      console.error("Error toggling prompt state:", err)
    }
  }

  const handleToggleHide = async (prompt) => {
    try {
      await togglePromptHide(prompt.idprompt)
      fetchPrompts()
    } catch (err) {
      console.error("Error toggling prompt hide state:", err)
    }
  }

  const handleMoveOrder = async (prompt, direction) => {
    try {
      await movePromptOrder(prompt.idprompt, direction)
      fetchPrompts()
    } catch (err) {
      console.error("Error moving prompt order:", err)
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
              <th>Path</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.idprompt}>
                <td>{prompt.promptname}</td>
                <td>{prompt.model}</td>
                <td>{prompt.temperature}</td>
                <td>{prompt.path}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleToggleHide(prompt)}
                    className="hide-btn"
                  >
                    <i
                      className={`fas fa-${
                        prompt.ishide ? "eye-slash" : "eye"
                      }`}
                    ></i>
                  </button>
                  <button
                    onClick={() => handleToggleActive(prompt)}
                    className={`status-btn ${
                      prompt.isactive ? "active" : "inactive"
                    }`}
                  >
                    <i
                      className={`fas fa-${
                        prompt.isactive ? "check-circle" : "times-circle"
                      }`}
                    ></i>
                  </button>
                  <button
                    onClick={() => handleDeletePrompt(prompt)}
                    className="delete-btn"
                  >
                    <i className="fas fa-trash"></i>
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
