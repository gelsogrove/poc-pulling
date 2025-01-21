import React, { useEffect, useState } from "react"
import { deleteUnlikeRecord, fetchUnlikeData } from "./api/unlike_api"
import "./UnlikePopup.css"

const UnlikePopup = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const getData = async () => {
      try {
        const fetchedData = await fetchUnlikeData()
        setData(fetchedData || [])
      } catch (error) {
        console.error("Error in UnlikePopup:", error)
      }
    }

    getData()
  }, [])

  const handleDelete = async (id) => {
    console.log("Attempting to delete record with ID:", id)
    try {
      const success = await deleteUnlikeRecord(id)
      console.log("Delete result:", success)
      if (success) {
        setData((prevData) => prevData.filter((item) => item.idunlike !== id))
        console.log("Record deleted successfully.")
      } else {
        console.error("Failed to delete record.")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  return (
    <div>
      <h3>Unlike Popup</h3>
      <table className="unlike-table">
        <thead>
          <tr>
            <th>Datetime</th>
            <th>Conversation ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.idunlike}>
              <td>{new Date(item.datatime).toLocaleString()}</td>
              <td>{item.conversationid}</td>
              <td>
                <button
                  onClick={() => handleDelete(item.idunlike)}
                  className="delete-button"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UnlikePopup
