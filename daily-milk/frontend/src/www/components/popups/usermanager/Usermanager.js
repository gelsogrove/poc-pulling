import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import {
  changePassword,
  deleteUser,
  fetchUsers,
  getRoles,
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
  const [roles, setRoles] = useState([])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await fetchUsers()
        setUsers(usersData)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      }
    }

    const fetchRoles = async () => {
      try {
        const rolesData = await getRoles()
        setRoles(rolesData)
      } catch (error) {
        console.error("Error fetching roles:", error)
      }
    }

    loadUsers()
    fetchRoles()
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
        <div className="close-button-container">
          <CloseButton onClose={onClose} />
        </div>
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
          roles={roles}
        />
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th className="small-col">Name</th>
                <th className="small-col">Surname</th>
                <th className="small-col2">Username</th>
                <th className="small-col2">Role</th>
                <th className="small-col">Last Connected</th>
                <th className="small-col1"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userid}
                  onClick={(e) => {
                    if (e.target.closest(".small-col1")) {
                      return
                    }
                    handleEditUser(user)
                  }}
                >
                  <td className="small-col">{user.name}</td>
                  <td className="small-col">{user.surname}</td>
                  <td className="small-col2">{user.username}</td>
                  <td className="small-col2">{user.role}</td>
                  <td className="small-col">
                    {user.last_connected
                      ? new Date(user.last_connected).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="small-col1" style={{ cursor: "default" }}>
                    <button
                      className={`toggle-btn ${
                        user.isactive ? "deactivate" : "activate"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleUserActive(user)
                      }}
                      disabled={user.role === "Admin"}
                      title={
                        user.isactive
                          ? "Click to deactivate"
                          : "Click to activate"
                      }
                      style={{
                        backgroundColor:
                          user.role === "Admin"
                            ? "lightgray"
                            : user.isactive
                            ? "green"
                            : "",
                        color:
                          user.role === "Admin"
                            ? "black"
                            : user.isactive
                            ? "white"
                            : "white",
                        cursor:
                          user.role === "Admin" ? "not-allowed" : "pointer",
                      }}
                    >
                      {user.isactive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteUser(user.userid)
                      }}
                      disabled={user.role === "Admin"}
                      style={{
                        backgroundColor:
                          user.role === "Admin" ? "lightgray" : "",
                        color: user.role === "Admin" ? "black" : "white",
                        cursor:
                          user.role === "Admin" ? "not-allowed" : "pointer",
                      }}
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
