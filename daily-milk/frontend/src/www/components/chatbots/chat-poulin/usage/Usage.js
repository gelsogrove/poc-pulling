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

  useEffect(() => {
    const getData = async () => {
      const data = await fetchUsageData()

      setUsageData(data)
      if (data && data.totalCurrentMonth) {
        setInitialTotalCurrentMonth(data.totalCurrentMonth)
      }
    }
    getData()
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
          Last upate:
          <h4>20/12/2025 19:40</h4>
          <hr />
          client of the month
          <h4>Farm village snc</h4>
          <hr />
          Product of the month
          <h4>comita xxx</h4>
          <hr />
          Seller of the month
          <h4>Andrea Gelsomino</h4>
        </>
      ) : (
        <div className="loading-message">Loading...</div>
      )}
    </div>
  )
}

export default Usage
