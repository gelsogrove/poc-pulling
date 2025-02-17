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
  const [prompt, setPrompt] = useState({
    content: "",
    model: "",
    temperature: 0,
    promptname: "",
    image: "/images/chatbot.webp",
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
      console.log("Fetched prompts:", data)
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
        ...(name === "content" ? { prompt: value } : {}),
      }))
    } else {
      setPrompt((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "content" ? { prompt: value } : {}),
      }))
    }
  }

  const handleSave = async () => {
    try {
      const saveData = editingPrompt
        ? {
            ...editingPrompt,
            prompt: editingPrompt.content,
          }
        : {
            ...prompt,
            prompt: prompt.content,
          }

      if (editingPrompt) {
        await updatePrompt(editingPrompt.idprompt, saveData)
      } else {
        await createPrompt(saveData)
      }
      setShowForm(false)
      setEditingPrompt(null)
      setPrompt({
        content: "",
        model: "",
        temperature: 0,
        promptname: "",
        image: "/images/chatbot.webp",
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
    } catch (error) {
      console.error(`Error moving prompt ${direction}:`, error)
    }
  }

  const handleRowClick = (prompt) => {
    console.log("Prompt data received:", prompt)
    const formData = {
      ...prompt,
      content: prompt.prompt,
      promptname: prompt.promptname,
      model: prompt.model,
      temperature: prompt.temperature,
      image: prompt.image || "/images/chatbot.webp",
      path: prompt.path,
    }
    console.log("Form data being set:", formData)
    setEditingPrompt(formData)
    setPrompt(formData)
    setShowForm(true)
  }

  return (
    <div className="prompt-manager">
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>

      <div className="popup-title">
        <h2>Prompts</h2>
        {!editingPrompt && (
          <button className="add-button" onClick={handleAddNewPrompt}>
            Add
          </button>
        )}
      </div>

      {showForm ? (
        <PromptForm
          prompt={editingPrompt || prompt}
          handleInputChange={handleInputChange}
          handleSave={handleSave}
          handleCancel={() => {
            setShowForm(false)
            setEditingPrompt(null)
            setPrompt({
              content: "",
              model: "",
              temperature: 0,
              promptname: "",
              image: "/images/chatbot.webp",
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
            {prompts.map((prompt, index) => (
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveOrder(prompt, "up")
                    }}
                    className="move-btn"
                    disabled={index === 0}
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveOrder(prompt, "down")
                    }}
                    className="move-btn"
                    disabled={index === prompts.length - 1}
                  >
                    <i className="fas fa-arrow-down"></i>
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
