/* eslint-disable react-hooks/exhaustive-deps */
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js"
import React, { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import { fetchUsageData } from "../../chatbots/usage/api/utils_api"
import monthlyData from "./api/monthlyData_api"
import "./InvoicePopup.css"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const InvoicePopup = ({ onClose }) => {
  const [data, setData] = useState([])
  const [usageData, setUsageData] = useState(null)

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  useEffect(() => {
    // Fetch monthly data
    const getMonthlyData = async () => {
      const data = await monthlyData()
      setData(data)
    }
    getMonthlyData()

    // Fetch usage statistics
    const getData = async () => {
      const usageData = await fetchUsageData()

      // Sort months by year and month
      usageData.lastmonths.sort((a, b) => {
        const dateA = new Date(
          `${a.year}-${monthNames.indexOf(a.month) + 1}-01`
        )
        const dateB = new Date(
          `${b.year}-${monthNames.indexOf(b.month) + 1}-01`
        )
        return dateA - dateB
      })

      setUsageData(usageData)
    }
    getData()
  }, [])

  // Prepare data for the chart
  const barData = {
    labels: usageData?.lastmonths
      ? usageData.lastmonths
          .slice(-12)
          .map((item) => `${item.month} ${item.year}`)
      : [],
    datasets: [
      {
        label: "Monthly Totals",
        data: usageData?.lastmonths
          ? usageData.lastmonths
              .slice(-12)
              .map((item) => parseFloat(item.total))
          : [],
        backgroundColor: "rgba(153,102,255,0.6)",
        borderColor: "rgba(153,102,255,1)",
        borderWidth: 2,
      },
    ],
  }

  // Chart options
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
    height: 800,
  }

  return (
    <div className="invoices-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      <h3>Invoices</h3>
      <br />
      <div style={{ height: "240px", width: "100%" }}>
        <Bar data={barData} options={barOptions} style={{ marginTop: "0px" }} />
      </div>
      <br />
      <table border="0" width="97%">
        <thead>
          <tr>
            <th>Year</th>
            <th>Month</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Invoice </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.year}</td>
              <td>{monthNames[item.month - 1]}</td>
              <td>{item.total}</td>
              <td>{item.paid ? "Yes" : "No"}</td>
              <td>
                <button className="btnInvoice">Download</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InvoicePopup
