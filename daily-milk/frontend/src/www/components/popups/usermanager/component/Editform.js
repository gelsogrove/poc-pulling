import React from "react"
import "./Editform.css"

const EditForm = ({
  editedUser,
  handleEditInputChange,
  handleSaveEdit,
  handleCancelEdit,
}) => {
  if (!editedUser) return null

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!editedUser.name || !editedUser.surname || !editedUser.username) {
      alert("Name, Surname, and Username cannot be empty.")
      return
    }
    handleSaveEdit()
  }

  return (
    <form className="edit-form" onSubmit={handleFormSubmit}>
      <div className="input-group">
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={editedUser.name || ""}
            onChange={handleEditInputChange}
            required
          />
        </label>
        <label>
          Surname:
          <input
            type="text"
            name="surname"
            value={editedUser.surname || ""}
            onChange={handleEditInputChange}
            required
          />
        </label>
        <label className="role-container">
          Username:
          <input
            type="text"
            name="username"
            value={editedUser.username || ""}
            onChange={handleEditInputChange}
            required
          />
        </label>
        <label className="role-container">
          Role:
          <select
            name="role"
            value={editedUser.role || ""}
            onChange={handleEditInputChange}
          >
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
          Cancel
        </button>

        <button type="submit" className="save-btn">
          Save
        </button>
      </div>
    </form>
  )
}

export default EditForm
