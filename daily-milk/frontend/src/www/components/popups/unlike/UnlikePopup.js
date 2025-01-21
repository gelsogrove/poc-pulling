import React, { useEffect, useState } from "react"
import { deleteUnlikeRecord, fetchUnlikeData } from "./api/unlike_api"
import "./UnlikePopup.css"

const UnlikePopup = ({ onClose }) => {
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
    try {
      const success = await deleteUnlikeRecord(id)
      if (success) {
        setData((prevData) => prevData.filter((item) => item.idunlike !== id))
        console.log("Record deleted successfully.")
      }
    } catch (error) {
      console.error("Error deleting record:", error)
    }
  }

  return (
    <div className="unlike-popup">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h3>Unlike Popup</h3>
      {data.length === 0 ? (
        <p className="no-data-message">Non ci sono conversazioni salvate.</p>
      ) : (
        <table className="unlike-table">
          <thead>
            <tr>
              <th>Datetime</th>

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
                    className="icon-button"
                  >
                    🗑️
                  </button>
                  <button className="icon-button">📂</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default UnlikePopup
