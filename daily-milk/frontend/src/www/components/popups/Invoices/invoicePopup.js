// daily-milk/frontend/src/www/components/UsageTable.js
import React, { useEffect, useState } from "react"
import monthlyData from "./api/monthlyData"

const InvoicePopup = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const getData = async () => {
      const usageData = await monthlyData()
      setData(usageData)
    }
    getData()
  }, [])

  return (
    <div className="prompts-form-container">
      <h3>Monthly Usage</h3>
      <table border="0">
        <thead>
          <tr>
            <th>Year</th>
            <th>Month</th>
            <th>Total</th>
            <th>Service</th>
            <th>Paid</th>
            <th> </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.year}</td>
              <td>{item.month}</td>
              <td>{item.total}</td>
              <td>{item.service}</td>
              <td>{item.paid ? "Yes" : "No"}</td>
              <td>
                <button>Download Invoice</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InvoicePopup
