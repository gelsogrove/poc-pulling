import React, { useEffect, useState } from "react"
import {
  deleteUser,
  fetchUsers,
  toggleUserActive,
  updateUser,
} from "./api/usermanager_api.js"
import EditForm from "./component/Editform.js" // Importiamo il componente EditForm
import "./Usermanager.css"

const UserManager = ({ onClose }) => {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)

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

  // Conta il numero di admin nel sistema
  const adminCount = users.filter((user) => user.role === "Admin").length

  // Gestisce l'editing
  const handleEditUser = (user) => {
    setEditingUser({ ...user }) // Imposta l'utente in modifica
  }

  const handleEditCancel = () => {
    setEditingUser(null) // Chiude la form di editing senza salvare
  }

  const handleSaveEdit = async (updatedUser) => {
    try {
      // Chiama direttamente la funzione updateUser dall'API
      const updatedUserFromAPI = await updateUser(
        updatedUser.userid,
        updatedUser
      )

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

  return (
    <div className="user-manager-container">
      <div className="header">
        <h2>Manage Users</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {editingUser ? (
        // Usa EditForm invece del codice inline
        <EditForm
          editedUser={editingUser}
          handleEditInputChange={(e) =>
            setEditingUser({ ...editingUser, [e.target.name]: e.target.value })
          }
          handleSaveEdit={() => handleSaveEdit(editingUser)}
          handleCancelEdit={handleEditCancel}
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
              {users.map((user) => {
                const isLastAdmin = user.role === "Admin" && adminCount === 1

                return (
                  <tr key={user.id} onClick={() => handleEditUser(user)}>
                    <td className="small-col">{user.name}</td>
                    <td className="small-col">{user.surname}</td>
                    <td>{user.username}</td>
                    <td className="small-col1">{user.role}</td>
                    <td className="small-col1">
                      <button
                        className={`toggle-btn ${
                          user.isactive ? "deactivate" : "activate"
                        } ${isLastAdmin ? "disabled-btn" : ""}`}
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (isLastAdmin) return
                          try {
                            await toggleUserActive(user.userid, !user.isactive)
                            setUsers((prevUsers) =>
                              prevUsers.map((u) =>
                                u.userid === user.userid
                                  ? { ...u, isactive: !u.isactive }
                                  : u
                              )
                            )
                          } catch (error) {
                            console.error("Error toggling user state:", error)
                          }
                        }}
                        disabled={isLastAdmin}
                      >
                        {user.isactive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className={`delete-btn ${
                          isLastAdmin ? "disabled-btn" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isLastAdmin) {
                            handleDeleteUser(user.userid)
                          }
                        }}
                        disabled={isLastAdmin}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManager
