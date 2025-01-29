import React, { useEffect, useState } from "react"
import "./Usermanager.css"
import {
  createUser,
  deleteUser,
  fetchUsers,
  toggleUserActive,
} from "./api/usermanager_api"

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

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
  }

  const handleCreateUser = async () => {
    try {
      const newUser = {
        name: "New User",
        surname: "Default",
        username: `user${Date.now()}`,
        role: "User",
        active: true,
        isActive: true,
      }
      const createdUser = await createUser(newUser)
      setUsers((prevUsers) => [...prevUsers, createdUser])
    } catch (error) {
      console.error("Error creating user:", error)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId)
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleToggleActive = async (userId, isActive) => {
    try {
      const updatedUser = await toggleUserActive(userId, isActive)
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      )
    } catch (error) {
      console.error("Error toggling user active status:", error)
    }
  }

  return (
    <div className="user-manager-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h2>Manage Users</h2>
      <button onClick={handleCreateUser}>Create User</button>
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Surname</th>
              <th style={{ width: "200px" }}>Username</th>
              <th>Role</th>
              <th style={{ width: "100px" }}>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} onClick={() => handleEditUser(user)}>
                <td>{user.name}</td>
                <td>{user.surname}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td style={{ color: user.isActive ? "green" : "red" }}>
                  {user.isActive ? "Active" : "Not Active"}
                </td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleActive(user.id, !user.isActive)
                    }}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteUser(user.id)
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
    </div>
  )
}

export default UserManager
