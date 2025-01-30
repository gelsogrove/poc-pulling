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
  users, // aggiungiamo questa prop
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
    const adminCount = users.filter((user) => user.role === "Admin").length
    return adminCount === 1 && editedUser.role === "Admin"
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
        <label className="role-container">
          Role:
          <select
            name="role"
            value={editedUser.role}
            onChange={handleEditInputChange}
            disabled={isOnlyAdmin()}
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </label>
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
          onClick={() =>
            setShowChangePassword(!showChangePassword, editedUser.userid)
          }
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
