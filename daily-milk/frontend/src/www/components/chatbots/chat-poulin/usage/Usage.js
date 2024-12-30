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
import React from "react"
import { Bar, Line } from "react-chartjs-2"

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
  // Dati statici per i grafici
  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Spese settimanali ($)",
        data: [10, 20, 15, 30, 25, 10, 5],
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 2,
        fill: true,
      },
    ],
  }

  const barData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Spese mensili ($)",
        data: [300, 250, 400, 450, 500, 350, 600, 700, 500, 400, 300, 450],
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
      <br />
      id conversation:
      <br />{" "}
      <b>
        <font size="1">{IdConversation}</font>
      </b>
      <br /> <br />
      Conversation: <h2>0.40 $</h2>
      <br />
      Weekly usage:
      <br />
      <Line data={lineData} options={lineOptions} />
      <br />
      Monthly usage:
      <Bar data={barData} options={barOptions} style={{ marginTop: "20px" }} />
      <br />
      Last update: 01-02-2025
    </div>
  )
}

export default Usage
