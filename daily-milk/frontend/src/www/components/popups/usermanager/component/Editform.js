import React from "react"

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

  const toggleActiveStatus = () => {
    handleEditInputChange({
      target: { name: "active", value: !editedUser.active },
    })
  }

  return (
    <form className="edit-form" onSubmit={handleFormSubmit}>
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
      <label>
        Username:
        <input
          type="text"
          name="username"
          value={editedUser.username || ""}
          onChange={handleEditInputChange}
          required
        />
      </label>
      <label>
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
      <div
        className="form-actions"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={handleCancelEdit}>
            &lt;&lt; Back
          </button>
        </div>

        <button type="button">Change Passsword</button>
        <button
          type="button"
          onClick={toggleActiveStatus}
          style={{
            backgroundColor: editedUser.active ? "#28a745" : "#6c757d",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {editedUser.active ? "Active" : "Not Active"}
        </button>

        <button type="button">Delete</button>
        <button type="button">Save</button>
      </div>
    </form>
  )
}

export default EditForm
