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
import { Bar, Line } from "react-chartjs-2"
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

  // Dati statici per i grafici
  const lineData = {
    labels: usageData ? usageData.currentWeek.map((item) => item.day) : [],
    datasets: [
      {
        label: "",
        data: usageData
          ? usageData.currentWeek.map((item) => parseFloat(item.total))
          : [],
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 2,

        fill: true,
      },
    ],
  }

  const barData = {
    labels: usageData
      ? usageData.lastmonths.slice(-6).map((item) => item.month)
      : [],
    datasets: [
      {
        label: "",
        data: usageData
          ? usageData.lastmonths.slice(-6).map((item) => parseFloat(item.total))
          : [],
        backgroundColor: usageData
          ? usageData.lastmonths
              .slice(-6)
              .map((_, index) =>
                index === 5 ? "rgba(255,0,0,0.6)" : "rgba(153,102,255,0.6)"
              )
          : [],
        borderColor: "rgba(153,102,255,1)",
        borderWidth: 2,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    height: 400, // imposta l'altezza
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        ticks: {
          autoSkip: false,
        },
      },
    },
    height: 800, // imposta l'altezza
  }

  console.log("Bar data:", barData)

  return (
    <div className="usage-container">
      {usageData && usageData.error ? (
        <div className="error-message">{usageData.error}</div>
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
          <hr></hr>
          <br />
          <div className="subtitle">
            Weekly usage:{" "}
            <b>{parseFloat(usageData.totalCurrentWeek).toFixed(2)} $</b>
          </div>
          <div style={{ height: "240px", width: "100%" }}>
            <Line data={lineData} options={lineOptions} />
          </div>
          <br />
          <hr></hr>
          <br />
          <div className="subtitle">
            Monthly usage:{" "}
            <b>{parseFloat(usageData.totalCurrentMonth).toFixed(2)} $</b>
          </div>
          <div style={{ height: "240px", width: "100%" }}>
            <Bar
              data={barData}
              options={barOptions}
              style={{ marginTop: "0px" }}
            />
          </div>
        </>
      ) : (
        <div className="loading-message">Loading...</div>
      )}
    </div>
  )
}

export default Usage
