/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react"
import CloseButton from "../../share/CloseButton"
import ChatHistory from "../shared/ChatHistory"
import {
  deleteUnlikeRecord,
  fetchUnlikeData,
  fetchUserName,
} from "./api/unlike_api"
import "./UnlikePopup.css"

const UnlikePopup = ({ idPrompt, onClose }) => {
  const [data, setData] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")

  useEffect(() => {
    const getData = async () => {
      try {
        const fetchedData = await fetchUnlikeData(idPrompt)
        console.log(fetchedData)

        const resp = await fetchUserName(fetchedData.userId)
        setUsername(resp.username)
        setData(fetchedData || [])
        if (fetchedData && fetchedData.length > 0) {
          setSelectedItem(fetchedData[0])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    getData()
  }, [])

  const handleRowClick = async (item) => {
    setSelectedItem(item)
    console.log(item)
    const resp = await fetchUserName(item.userId)
    setUsername(resp.username)
    console.log(`Model: ${item.model}, Temperature: ${item.temperature}`)
  }

  const handleDeleteChat = async () => {
    if (!selectedItem) return

    const isConfirmed = window.confirm(
      "Are you sure you want to delete this chat ?"
    )
    if (!isConfirmed) return

    try {
      const success = await deleteUnlikeRecord(selectedItem.idunlike)
      if (success) {
        const updatedData = data.filter(
          (item) => item.idunlike !== selectedItem.idunlike
        )
        setData(updatedData)
        setSelectedItem(updatedData.length > 0 ? updatedData[0] : null)
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
      <div className="close-button-container">
        <CloseButton onClose={onClose} />
      </div>
      <h1>Unlike</h1>
      <div className="content-container">
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : data.length === 0 ? (
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
                  {data.map((item) => {
                    const firstMessage = getFirstUserMessage(
                      item.conversationhistory
                    )
                    return (
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
                          {firstMessage}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="chat">
              {selectedItem?.conversationhistory ? (
                <div>
                  <ChatHistory
                    msgIds={[selectedItem.msgid]} // Passa un array contenente il msgId
                    username={username}
                    messages={JSON.parse(selectedItem.conversationhistory)}
                    onDeleteChat={handleDeleteChat}
                    model={selectedItem.model} // Passa il modello
                    temperature={selectedItem.temperature} // Passa la temperatura
                  />
                </div>
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
