import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import React, { useCallback, useEffect, useState } from "react"
import "./Usage.css"

import { fetchUsageData, getPromptDetails } from "./api/utils_api"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const Usage = ({ IdConversation, refresh }) => {
  const [usageData, setUsageData] = useState(null)
  const [initialTotalCurrentMonth, setInitialTotalCurrentMonth] = useState(null)
  const [currentChatDifference, setCurrentChatDifference] = useState(0)
  const [temperature, setTemperature] = useState(null)
  const [model, setModel] = useState(null)

  // Memorizza fetchData per evitare che venga ricreata ad ogni render
  const fetchData = useCallback(async () => {
    // Fetch Usage Data
    const data = await fetchUsageData()
    setUsageData(data)

    // Calcola la differenza
    if (data && data.totalCurrentMonth) {
      if (initialTotalCurrentMonth === null) {
        setInitialTotalCurrentMonth(data.totalCurrentMonth)
      } else {
        const difference = data.totalCurrentMonth - initialTotalCurrentMonth
        setCurrentChatDifference(difference)
      }
    }

    // Fetch Temperature and Model
    const { temperature, model } = await getPromptDetails()
    setTemperature(temperature)
    setModel(model)
  }, [initialTotalCurrentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData, refresh])

  return (
    <div className="usage-container">
      {usageData && usageData.error ? (
        <div className="error-message">
          <b>Error:</b>
          <br />
          Request limit reached today :-(
        </div>
      ) : usageData ? (
        <>
          <div className="title-usage"></div>
          <h3>{currentChatDifference.toFixed(2)} $</h3>
          <br />
          Current monthly usage:
          <div>{usageData.totalCurrentMonth} $</div>
          <hr />
          Model:
          <div>{model}</div>
          <hr />
          Temperature:
          <div>{temperature}</div>
          <hr />
          PromptId:
          <div>a2c502db-9425-4c66-9d92-acd3521b38b5</div>
          <hr />
          ConversationId:
          <div>{IdConversation}</div>
          <hr />
        </>
      ) : (
        <div className="loading-message">Loading...</div>
      )}
    </div>
  )
}

export default Usage
