// src/components/Usage.js
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
import React, { useEffect, useState } from "react"
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
  const [, setInitialTotalCurrentMonth] = useState(0)

  const [temperature, setTemperature] = useState(null)
  const [model, setModel] = useState(null)

  const fetchData = async () => {
    // Usage
    const data = await fetchUsageData()
    setUsageData(data)
    if (data && data.totalCurrentMonth) {
      setInitialTotalCurrentMonth(data.totalCurrentMonth)
    }

    // Temperature Model
    const { temperature, model } = await getPromptDetails()
    setTemperature(temperature)
    setModel(model)
  }

  useEffect(() => {
    fetchData()
  }, [refresh])

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
          Current monthly usage:
          <h3>{usageData.totalCurrentMonth} $</h3>
          <hr />
          Model:
          <h4>{model}</h4>
          <hr />
          Temperature:
          <h4>{temperature}</h4>
          <hr />
        </>
      ) : (
        <div className="loading-message">Loading...</div>
      )}
    </div>
  )
}

export default Usage
