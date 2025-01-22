import React, { useEffect, useState } from "react"
import ChatHistory from "../shared/ChatHistory"
import { deleteUnlikeRecord, fetchUnlikeData } from "./api/unlike_api"
import "./UnlikePopup.css"

const UnlikePopup = ({ onClose }) => {
  const [data, setData] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true) // Stato per il caricamento

  useEffect(() => {
    const getData = async () => {
      try {
        const fetchedData = await fetchUnlikeData()
        setData(fetchedData || [])
        if (fetchedData && fetchedData.length > 0) {
          setSelectedItem(fetchedData[0]) // Seleziona il primo elemento per default
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false) // Caricamento completato
      }
    }

    getData()
  }, [])

  const handleRowClick = (item) => {
    setSelectedItem(item)
  }

  const handleDeleteChat = async () => {
    if (!selectedItem) return

    try {
      const success = await deleteUnlikeRecord(selectedItem.idunlike)
      if (success) {
        const updatedData = data.filter(
          (item) => item.idunlike !== selectedItem.idunlike
        )
        setData(updatedData)
        setSelectedItem(updatedData.length > 0 ? updatedData[0] : null) // Seleziona il primo elemento rimanente
      } else {
        console.error("Failed to delete the record.")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const getFirstUserMessage = (conversationHistory) => {
    const messages = JSON.parse(conversationHistory)
    const firstUserMessage = messages.find((msg) => msg.role === "user")
    return firstUserMessage ? firstUserMessage.content : "N/A"
  }

  return (
    <div className="unlike-popup">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h1>Unlike</h1>
      <div className="content-container">
        {loading ? ( // Mostra caricamento se i dati non sono ancora arrivati
          <div className="loading-message">Loading...</div>
        ) : data.length === 0 ? ( // Nessun record trovato
          <div className="no-data-message">No unlike message</div>
        ) : (
          <>
            <div className="unlike-table-container">
              <table className="unlike-table">
                <thead>
                  <tr>
                    <th>Chats</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr
                      key={item.idunlike}
                      onClick={() => handleRowClick(item)}
                      className={
                        selectedItem?.idunlike === item.idunlike
                          ? "selected"
                          : ""
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {new Date(item.datatime).toLocaleString()} -{" "}
                        {getFirstUserMessage(item.conversationhistory)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="chat">
              {selectedItem?.conversationhistory ? (
                <ChatHistory
                  messages={JSON.parse(selectedItem.conversationhistory)}
                  onDeleteChat={handleDeleteChat}
                />
              ) : (
                <p></p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UnlikePopup
