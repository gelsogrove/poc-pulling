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

  useEffect(() => {
    const getData = async () => {
      const data = await fetchUsageData()
      setUsageData(data)
    }
    getData()
  }, [])

  // Dati statici per i grafici
  const lineData = {
    labels: usageData ? usageData.currentWeek.map((item) => item.day) : [],
    datasets: [
      {
        label: "Spese settimanali ($)",
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
    labels: usageData ? usageData.lastmonths.map((item) => item.month) : [],
    datasets: [
      {
        label: "Spese mensili ($)",
        data: usageData
          ? usageData.lastmonths.map((item) => parseFloat(item.total))
          : [],
        backgroundColor: "rgba(153,102,255,0.6)",
        borderColor: "rgba(153,102,255,1)",
        borderWidth: 1,
      },
    ],
  }

  const lineOptions = {
    responsive: true,
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
  }

  const barOptions = {
    responsive: true,
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
  }

  return (
    <div className="usage-container">
      <div className="title-usage"></div>
      Conversation: <h2>0.40 $</h2>
      <br />
      <Line data={lineData} options={lineOptions} />
      <br />
      <Bar data={barData} options={barOptions} style={{ marginTop: "20px" }} />
    </div>
  )
}

export default Usage
