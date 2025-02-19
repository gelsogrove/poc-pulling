/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react"
import { DeleteHistory, GetHistoryChats } from "./api/history_api"
import "./HistoryPopup.css"

const HistoryPopup = ({ onClose, chatbotSelected, idPrompt }) => {
  const [historyData, setHistoryData] = useState([])

  useEffect(() => {
    fetchHistoryData()
  }, [])

  const fetchHistoryData = async () => {
    try {
      const data = await GetHistoryChats(idPrompt, chatbotSelected)
      setHistoryData(data || [])
    } catch (error) {
      console.error("Error fetching history data:", error)
      setHistoryData([])
    }
  }

  const handleDeleteHistory = async (idHistory) => {
    try {
      const success = await DeleteHistory(idHistory, chatbotSelected)
      if (success) {
        setHistoryData(
          historyData.filter((item) => item.idHistory !== idHistory)
        )
      }
    } catch (error) {
      console.error("Error deleting history:", error)
    }
  }

  return (
    <div className="popup-overlay">
      <div className="popup-content history-popup">
        <div className="popup-header">
          <h2>Chat History</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="popup-body">
          {historyData.length > 0 ? (
            historyData.map((history) => (
              <div key={history.idHistory} className="history-item">
                <p>{history.content}</p>
                <button onClick={() => handleDeleteHistory(history.idHistory)}>
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p>No history available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryPopup
