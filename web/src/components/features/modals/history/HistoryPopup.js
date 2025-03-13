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
      console.log("Fetching with:", { idPrompt, chatbotSelected })
      const data = await GetHistoryChats(idPrompt, chatbotSelected)
      setHistoryData(data || [])
    } catch (error) {
      console.error("Error fetching history data:", error)
      setHistoryData([])
    }
  }

  const handleDeleteHistory = async (idhistory) => {
    try {
      await DeleteHistory(idhistory, chatbotSelected)
      setHistoryData((currentData) =>
        currentData.filter((item) => item.idhistory !== idhistory)
      )
      console.log("Element removed:", idhistory)
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
              <div key={history.idhistory} className="history-item">
                {console.log("History object:", history)}
                <div>Data: {new Date(history.datetime).toLocaleString()}</div>
                <div>ID: {history.idhistory}</div>
                <pre>
                  {JSON.stringify(JSON.parse(history.history), null, 2)}
                </pre>
                <button onClick={() => handleDeleteHistory(history.idhistory)}>
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
