import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import {
  createModel,
  deleteModel,
  getModels,
  updateModel,
} from "./api/models_api"
import "./ModelsPopup.css"

const ModelsPopup = ({ onClose }) => {
  const [models, setModels] = useState([])
  const [newModel, setNewModel] = useState("")
  const [newNote, setNewNote] = useState("")
  const [editingModel, setEditingModel] = useState(null)
  const [error, setError] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const data = await getModels()
      setModels(data)
    } catch (err) {
      console.error("Error fetching models:", err)
    }
  }

  const handleAddModel = async () => {
    if (!newModel.trim()) {
      setError("The 'model' field cannot be empty.")
      return
    }
    try {
      await createModel(newModel, newNote)
      setNewModel("")
      setNewNote("")
      setError("")
      fetchModels()
    } catch (err) {
      console.error("Error creating model:", err)
    }
  }

  const handleEditModel = async () => {
    if (!editingModel.name.trim()) {
      setError("The 'model' field cannot be empty.")
      return
    }
    try {
      await updateModel(
        editingModel.idmodel,
        editingModel.name,
        editingModel.note
      )
      setEditingModel(null)
      setError("")
      setNewNote("")
      fetchModels()
    } catch (err) {
      console.error("Error updating model:", err)
    }
  }

  const handleDeleteModel = async (model) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this model?"
    )
    if (confirmDelete) {
      try {
        await deleteModel(model)

        fetchModels()
        setErrorMessage("")
      } catch (err) {
        console.error("Error deleting model:", err)
        if (err.response?.status === 400) {
          setErrorMessage("Cannot delete model because it is in use")
        }
      }
    }
  }

  const handleEditClick = (model) => {
    setEditingModel({
      idmodel: model.idmodel,
      name: model.model,
      note: model.note,
    })
    setNewModel("")

    setNewNote(model.note || "")
  }

  return (
    <div className="models-popup">
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>

      <div className="popup-title">
        <h2>Models</h2>
      </div>
      {error && <div className="error-message">{error}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {!editingModel && (
        <div className="add-model-container">
          <input
            type="text"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            placeholder="Add a new model"
          />
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note"
          />
          <button onClick={handleAddModel}>Add</button>
        </div>
      )}
      {editingModel && (
        <div className="add-model-container">
          <input
            type="text"
            value={editingModel.name}
            onChange={(e) =>
              setEditingModel({ ...editingModel, name: e.target.value })
            }
            placeholder="Edit model"
          />
          <input
            type="text"
            value={editingModel.note}
            onChange={(e) =>
              setEditingModel({ ...editingModel, note: e.target.value })
            }
            placeholder="Edit note"
          />
          <button onClick={handleEditModel}>Update</button>
        </div>
      )}
      <table className="models-table">
        <thead>
          <tr>
            <th>AI Models</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.idmodel}>
              <td>{model.model}</td>
              <td>{model.note}</td>
              <td>
                <button onClick={() => handleEditClick(model)}>Edit</button>
                <button
                  onClick={() => handleDeleteModel(model)}
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

export default ModelsPopup
