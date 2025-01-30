import React, { useEffect, useState } from "react"
import {
  changePassword,
  deleteUser,
  fetchUsers,
  toggleUserActive,
  updateUser,
} from "./api/usermanager_api.js"
import EditForm from "./component/Editform.js"
import "./Usermanager.css"

const UserManager = ({ onClose }) => {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [newPassword, setNewPassword] = useState("")
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await fetchUsers()
        setUsers(usersData)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      }
    }
    loadUsers()
  }, [])

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
    setShowChangePassword(false)
  }

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    )
    if (!confirmDelete) return

    try {
      await deleteUser(userId)
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.userid !== userId)
      )
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleSaveEdit = async (updatedUser) => {
    try {
      // Chiama direttamente la funzione updateUser dall'API
      const updatedUserFromAPI = await updateUser(
        updatedUser.userid,
        updatedUser
      )

      // Se la password è stata cambiata, chiama la funzione changePassword
      if (newPassword) {
        await changePassword(newPassword, updatedUser.userid) // Chiamata per cambiare la password
        setNewPassword("") // Resetta il campo di input della password
        setShowChangePassword(false) // Nasconde il campo di cambio password
      }

      // Aggiorna lo stato solo se l'API ha avuto successo
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.userid === updatedUser.userid ? updatedUserFromAPI : u
        )
      )

      setEditingUser(null) // Chiude la form dopo il salvataggio
    } catch (error) {
      console.error("Error updating user:", error)
      alert(
        `Failed to update user: ${
          error.response?.data?.message || error.message
        }`
      )
    }
  }

  const handleToggleUserActive = async (user) => {
    if (user.role === "Admin") return
    await toggleUserActive(user.userid, !user.isactive)
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.userid === user.userid ? { ...u, isactive: !u.isactive } : u
      )
    )
  }

  return (
    <div className="user-manager-container">
      <div className="header">
        <h2>Manage Users</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {editingUser ? (
        <EditForm
          editedUser={editingUser}
          handleEditInputChange={(e) =>
            setEditingUser({ ...editingUser, [e.target.name]: e.target.value })
          }
          handleSaveEdit={() => handleSaveEdit(editingUser)}
          handleCancelEdit={() => setEditingUser(null)}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          showChangePassword={showChangePassword}
          setShowChangePassword={setShowChangePassword}
          users={users}
        />
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th className="small-col">Name</th>
                <th className="small-col">Surname</th>
                <th>Username</th>
                <th className="small-col1">Role</th>
                <th className="small-col1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => handleEditUser(user)}>
                  <td className="small-col">{user.name}</td>
                  <td className="small-col">{user.surname}</td>
                  <td>{user.username}</td>
                  <td className="small-col1">{user.role}</td>
                  <td className="small-col1">
                    <button
                      className={`toggle-btn ${
                        user.isactive ? "deactivate" : "activate"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleUserActive(user)
                      }}
                      disabled={user.role === "Admin"}
                    >
                      {user.isactive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        if (user.role === "Admin") return
                        e.stopPropagation()
                        handleDeleteUser(user.userid)
                      }}
                      disabled={user.role === "Admin"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManager
