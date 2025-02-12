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
  updatePrompt,
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
  const [editingPrompt, setEditingPrompt] = useState(null)

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
    if (editingPrompt) {
      setEditingPrompt((prev) => ({
        ...prev,
        [name]: value,
      }))
    } else {
      setNewPrompt((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSave = async () => {
    try {
      if (editingPrompt) {
        await updatePrompt(editingPrompt.idprompt, editingPrompt)
      } else {
        await createPrompt(newPrompt)
      }
      setShowForm(false)
      setEditingPrompt(null)
      setNewPrompt({
        promptname: "",
        model: "",
        temperature: 0.7,
        prompt: "",
        path: "",
      })
      fetchPrompts()
    } catch (err) {
      console.error("Error saving prompt:", err)
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

  const handleRowClick = (prompt) => {
    setEditingPrompt(prompt)
    setNewPrompt({
      promptname: prompt.promptname,
      model: prompt.model,
      temperature: prompt.temperature,
      prompt: prompt.prompt,
      path: prompt.path,
    })
    setShowForm(true)
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
          prompt={editingPrompt || newPrompt}
          handleInputChange={handleInputChange}
          handleSave={handleSave}
          handleCancel={() => {
            setShowForm(false)
            setEditingPrompt(null)
            setNewPrompt({
              promptname: "",
              model: "",
              temperature: 0.7,
              prompt: "",
              path: "",
            })
          }}
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
              <tr key={prompt.idprompt} onClick={() => handleRowClick(prompt)}>
                <td>{prompt.promptname}</td>
                <td>{prompt.model}</td>
                <td>{prompt.temperature}</td>
                <td>{prompt.path}</td>
                <td
                  className="actions-cell"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleHide(prompt)
                    }}
                    className="hide-btn"
                  >
                    <i
                      className={`fas fa-${
                        prompt.ishide ? "eye-slash" : "eye"
                      }`}
                    ></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleActive(prompt)
                    }}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePrompt(prompt)
                    }}
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
