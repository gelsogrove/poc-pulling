// daily-milk/frontend/src/www/components/UsageTable.js
import React, { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import { fetchUsageData } from "../../chatbots/chat-poulin/usage/api/usageApi"
import monthlyData from "./api/monthlyData"
import "./invoicePopup.css"

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
    // MONTHLY DATA
    const getMonthlyData = async () => {
      const data = await monthlyData()

      setData(data)
    }
    getMonthlyData()

    // STATISTICS
    const getData = async () => {
      const usageData = await fetchUsageData()
      setUsageData(usageData)

      usageData.lastmonths.pop()
    }
    getData()
  }, [])

  const barData = {
    labels:
      usageData && usageData.lastmonths
        ? usageData.lastmonths.slice(-12).map((item) => item.month)
        : [],
    datasets: [
      {
        label: "",
        data:
          usageData && usageData.lastmonths
            ? usageData.lastmonths
                .slice(-12)
                .map((item) => parseFloat(item.total))
            : [],
        backgroundColor:
          usageData && usageData.lastmonths
            ? usageData.lastmonths
                .slice(-12)
                .map((_, index) =>
                  index === 5 ? "rgba(255,0,0,0.6)" : "rgba(153,102,255,0.6)"
                )
            : [],
        borderColor: "rgba(153,102,255,1)",
        borderWidth: 2,
      },
    ],
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
    height: 800,
  }

  return (
    <div className="prompts-form-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      <h3>Invoices</h3>
      <br />
      <div style={{ height: "240px", width: "100%" }}>
        <Bar data={barData} options={barOptions} style={{ marginTop: "0px" }} />
      </div>
      <br />
      <table border="0" width="100%">
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
                <button>Download</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InvoicePopup
