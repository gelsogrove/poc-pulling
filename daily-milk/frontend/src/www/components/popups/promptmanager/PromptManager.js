import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import { deletePrompt, getPrompts } from "./api/promptmanager_api"
import "./PromptManager.css"

const PromptManager = ({ onClose }) => {
  const [prompts, setPrompts] = useState([])
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [error, setError] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      const data = await getPrompts()
      setPrompts(data)
    } catch (err) {
      console.error("Error fetching prompts:", err)
    }
  }

  const handleEditClick = (prompt) => {
    setEditingPrompt({
      idprompt: prompt.idprompt,
      promptname: prompt.promptname,
      model: prompt.model,
      temperature: prompt.temperature,
      prompt: prompt.prompt,
    })
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

  return (
    <div className="prompt-manager">
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>

      <div className="popup-title">
        <h2>Prompts</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <table className="prompts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Model</th>
            <th>Temperature</th>
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
                <button onClick={() => handleEditClick(prompt)}>Edit</button>
                <button
                  onClick={() => handleDeletePrompt(prompt)}
                  style={{ backgroundColor: "red", marginLeft: "5px" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PromptManager
