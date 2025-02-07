import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import {
  createModel,
  deleteModel,
  getModels,
  updateModel,
} from "./api/models_api.js"
import "./ModelsPopup.css"

const ModelsPopup = ({ onClose }) => {
  const [models, setModels] = useState([])
  const [newModel, setNewModel] = useState("")
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
      setError("Il campo 'model' non può essere vuoto.")
      return
    }
    try {
      await createModel(newModel)
      setNewModel("")
      setError("")
      fetchModels()
    } catch (err) {
      console.error("Error creating model:", err)
    }
  }

  const handleEditModel = async () => {
    if (!editingModel.name.trim()) {
      setError("Il campo 'model' non può essere vuoto.")
      return
    }
    try {
      await updateModel(editingModel.idmodel, editingModel.name)
      setEditingModel(null)
      setError("")
      fetchModels()
    } catch (err) {
      console.error("Error updating model:", err)
    }
  }

  const handleDeleteModel = async (idmodel) => {
    const confirmDelete = window.confirm(
      "Sei sicuro di voler eliminare questo modello?"
    )
    if (confirmDelete) {
      try {
        const result = await deleteModel(idmodel)
        if (!result) {
          setError("Modello è in uso, non si può cancellare.")
        } else {
          fetchModels()
          setErrorMessage("")
        }
      } catch (err) {
        console.error("Error deleting model:", err)
        if (err.response?.status === 400) {
          setErrorMessage("Cannot delete model because it is in use")
        }
      }
    }
  }

  const handleEditClick = (model) => {
    setEditingModel({ idmodel: model.idmodel, name: model.model })
  }

  return (
    <div className="models-popup">
      <div className="popup-title">
        <h2>Gestione Modelli</h2>
        <CloseButton onClose={onClose} />
      </div>
      {error && <div className="error-message">{error}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <div>
        <input
          type="text"
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          placeholder="Aggiungi un nuovo modello"
        />
        <button onClick={handleAddModel}>Aggiungi</button>
      </div>
      {editingModel && (
        <div>
          <input
            type="text"
            value={editingModel.name}
            onChange={(e) =>
              setEditingModel({ ...editingModel, name: e.target.value })
            }
            placeholder="Modifica modello"
          />
          <button onClick={handleEditModel}>Aggiorna</button>
        </div>
      )}
      <table className="models-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Modello</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.idmodel}>
              <td>{model.idmodel}</td>
              <td>{model.model}</td>
              <td>
                <button onClick={() => handleEditClick(model)}>Modifica</button>
                <button onClick={() => handleDeleteModel(model.idmodel)}>
                  Elimina
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
