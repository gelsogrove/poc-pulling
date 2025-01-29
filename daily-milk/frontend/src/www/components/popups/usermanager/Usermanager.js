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
  const [, setEditingUser] = useState(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    surname: "",
    username: "",
    role: "User",
    active: true,
    isactive: true,
  })

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

  const handleCreateUserClick = () => {
    setCreatingUser(true)
  }

  const handleCreateUserSubmit = async () => {
    try {
      const createdUser = await createUser(newUser)
      setUsers((prevUsers) => [...prevUsers, createdUser])
      setCreatingUser(false)
      setNewUser({
        name: "",
        surname: "",
        username: "",
        role: "User",
        active: true,
        isactive: true,
      })
    } catch (error) {
      console.error("Error creating user:", error)
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

      {!creatingUser ? (
        <button className="create-user-btn" onClick={handleCreateUserClick}>
          Create User
        </button>
      ) : (
        <div className="create-user-form">
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Surname"
            value={newUser.surname}
            onChange={(e) =>
              setNewUser({ ...newUser, surname: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Username"
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
          />
          <div className="form-actions">
            <button
              className="cancel-btn"
              onClick={() => setCreatingUser(false)}
            >
              Cancel
            </button>
            <button className="save-btn" onClick={handleCreateUserSubmit}>
              Save
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Surname</th>
              <th>Username</th>
              <th>Role</th>

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

                <td>
                  <button
                    className="toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleUserActive(user.userid, !user.isactive)
                    }}
                  >
                    {user.isactive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteUser(user.id)
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
