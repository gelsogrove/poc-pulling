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

const Usage = ({ idPrompt, IdConversation, refresh }) => {
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

    // Fetch Temperature and Model

    const prompt = await getPromptDetails(idPrompt)
    setTemperature(prompt.temperature)
    setModel(prompt.model)
  }, [idPrompt])

  useEffect(() => {
    fetchData()
  }, [fetchData, refresh, idPrompt])

  useEffect(() => {
    if (usageData && usageData.totalCurrentMonth) {
      if (initialTotalCurrentMonth === null) {
        setInitialTotalCurrentMonth(usageData.totalCurrentMonth)
      } else {
        const difference =
          usageData.totalCurrentMonth - initialTotalCurrentMonth
        setCurrentChatDifference(difference)
      }
    }
  }, [usageData, initialTotalCurrentMonth])

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
          <div>{idPrompt}</div>
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
