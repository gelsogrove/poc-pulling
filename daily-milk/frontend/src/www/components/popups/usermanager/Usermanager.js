import React, { useEffect, useState } from "react"
import "./Usermanager.css"
import EditForm from "./component/Editform"

const UserManager = ({ onClose }) => {
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        name: "Admin",
        surname: "User",
        username: "admin",
        role: "Admin",
        active: true,
      },
      {
        id: 2,
        name: "Jane",
        surname: "Doe",
        username: "jane.doe",
        role: "User",
        active: false,
      },
      {
        id: 3,
        name: "John",
        surname: "Smith",
        username: "john.smith",
        role: "User",
        active: true,
      },
    ]
    setUsers(mockUsers)
  }, [])

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditingUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }))
  }

  const handleSaveEdit = () => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === editingUser.id ? editingUser : user))
    )
    setEditingUser(null)
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
  }

  return (
    <div
      className="user-manager-container"
      style={{ width: "90%", margin: "auto" }}
    >
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h2>{editingUser ? "Edit User" : "Manage Users"}</h2>
      {!editingUser ? (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => handleEditUser(user)}>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td style={{ color: user.active ? "green" : "red" }}>
                    {user.active ? "Active" : "Not Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EditForm
          editedUser={editingUser}
          handleEditInputChange={handleEditInputChange}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
        />
      )}
    </div>
  )
}

export default UserManager
