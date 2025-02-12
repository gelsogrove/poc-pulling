import React, { useState } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import "./Editform.css"

const EditForm = ({
  editedUser,
  handleEditInputChange,
  handleSaveEdit,
  handleCancelEdit,
  isLastAdmin, // Aggiunto per verificare se è l'ultimo Admin
  newPassword,
  setNewPassword,
  showChangePassword,
  setShowChangePassword,
  roles, // solo roles, rimuoviamo users
}) => {
  const [showPasswordText, setShowPasswordText] = useState(false)

  if (!editedUser) return null

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!editedUser.name || !editedUser.surname || !editedUser.username) {
      alert("Name, Surname, and Username cannot be empty.")
      return
    }
    handleSaveEdit()
  }

  const isOnlyAdmin = () => {
    // Controlla se è l'unico ruolo admin nei ruoli
    const adminRoles = roles.filter(
      (role) => role.role.toLowerCase() === "admin"
    )
    return adminRoles.length === 1 && editedUser.role.toLowerCase() === "admin"
  }

  return (
    <div className="edit-form">
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
        <div className="form-group">
          <label>Role:</label>
          <select
            name="role"
            value={editedUser.role}
            onChange={handleEditInputChange}
            className="input-field"
            disabled={isOnlyAdmin()}
          >
            {roles.map((role) => (
              <option key={role.idrole} value={role.role}>
                {role.role}
              </option>
            ))}
          </select>
        </div>
        {showChangePassword && (
          <label className="password-container">
            New Password
            <div className="password-input-container">
              <input
                type={showPasswordText ? "text" : "password"}
                placeholder="Nuova Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password-visibility"
                onClick={() => setShowPasswordText(!showPasswordText)}
              >
                {showPasswordText ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>
        )}
      </div>

      <div className="form-actions">
        <button className="cancel-btn" onClick={handleCancelEdit}>
          &#171; Cancel
        </button>
        <button
          className="change-password-btn"
          onClick={() => setShowChangePassword(!showChangePassword)}
        >
          {showChangePassword ? "Hide Password" : "Change Password"}
        </button>
        <button type="submit" className="save-btn" onClick={handleFormSubmit}>
          Save
        </button>
      </div>
    </div>
  )
}

export default EditForm
