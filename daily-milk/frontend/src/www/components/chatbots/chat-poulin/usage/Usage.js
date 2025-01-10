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
import { fetchUsageData } from "./api/usageApi"
import { getPromptDetails } from "./api/utils_api"

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

const Usage = ({ IdConversation }) => {
  const [usageData, setUsageData] = useState(null)
  const [initialTotalCurrentMonth, setInitialTotalCurrentMonth] = useState(0)

  const [temperature, setTemperature] = useState(null)
  const [model, setModel] = useState(null)

  useEffect(() => {
    // Usage
    const getData = async () => {
      const data = await fetchUsageData()
      setUsageData(data)
      if (data && data.totalCurrentMonth) {
        setInitialTotalCurrentMonth(data.totalCurrentMonth)
      }
    }

    // Temperature Model
    const getPromptDetasil = async () => {
      const { temperature, model } = await getPromptDetails()
      setTemperature(temperature)
      setModel(model)
    }

    getData()
    getPromptDetasil()
  }, [])

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
          Current chat:
          <h3>
            {(initialTotalCurrentMonth - usageData.totalCurrentMonth).toFixed(
              2
            )}{" "}
            $
          </h3>
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
