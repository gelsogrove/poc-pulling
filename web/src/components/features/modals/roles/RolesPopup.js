import React, { useEffect, useState } from "react"
import CloseButton from "../../../shared/CloseButton"
import { createRole, deleteRole, getRoles, updateRole } from "./api/roles_api"
import "./RolesPopup.css"

const RolesPopup = ({ onClose }) => {
  const [roles, setRoles] = useState([])
  const [newRole, setNewRole] = useState("")
  const [editingRole, setEditingRole] = useState(null)
  const [error, setError] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const data = await getRoles()
      setRoles(data)
    } catch (err) {
      console.error("Error fetching roles:", err)
    }
  }

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      setError("The 'role' field cannot be empty.")
      return
    }
    try {
      await createRole(newRole)
      setNewRole("")
      setError("")
      fetchRoles()
    } catch (err) {
      console.error("Error creating role:", err)
    }
  }

  const handleEditRole = async () => {
    if (!editingRole.name.trim()) {
      setError("The 'role' field cannot be empty.")
      return
    }
    try {
      await updateRole(editingRole.idrole, editingRole.name)
      setEditingRole(null)
      setError("")
      fetchRoles()
    } catch (err) {
      console.error("Error updating role:", err)
    }
  }

  const handleDeleteRole = async (role) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this role?"
    )
    if (confirmDelete) {
      try {
        await deleteRole(role)
        fetchRoles()
        setErrorMessage("")
      } catch (err) {
        console.error("Error deleting role:", err)
        if (err.response?.status === 400) {
          setErrorMessage(err.response.data.error)
        }
      }
    }
  }

  const handleEditClick = (role) => {
    setEditingRole({
      idrole: role.idrole,
      name: role.role,
    })
    setNewRole("")
  }

  return (
    <div className="roles-popup">
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>

      <div className="popup-title">
        <h2>Roles</h2>
      </div>
      {error && <div className="error-message">{error}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {!editingRole && (
        <div className="add-role-container">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Add a new role"
          />
          <button onClick={handleAddRole}>Add</button>
        </div>
      )}
      {editingRole && (
        <div className="add-role-container">
          <input
            type="text"
            value={editingRole.name}
            onChange={(e) =>
              setEditingRole({ ...editingRole, name: e.target.value })
            }
            placeholder="Edit role"
          />
          <button onClick={handleEditRole}>Update</button>
        </div>
      )}
      <table className="roles-table">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.idrole}>
              <td>{role.role}</td>
              <td>
                <button onClick={() => handleEditClick(role)}>Edit</button>
                <button
                  onClick={() => handleDeleteRole(role)}
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

export default RolesPopup
