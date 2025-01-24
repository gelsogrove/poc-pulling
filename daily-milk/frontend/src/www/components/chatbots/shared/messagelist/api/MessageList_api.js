import Cookies from "js-cookie"
const API_URL = process.env.REACT_APP_API_URL

export const createDynamicAsciiTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available..."
  }

  const headers = Object.keys(data[0])

  const formatNumber = (value) => {
    if (!isNaN(value) && value !== null && value !== "") {
      return parseInt(value, 10).toLocaleString("it-IT")
    }
    return value
  }

  const columnWidths = headers.map((header) =>
    Math.max(
      header.length,
      ...data.map((row) => String(formatNumber(row[header]) || "").length)
    )
  )

  const createRow = (row) =>
    "| " +
    headers
      .map((header, i) =>
        String(formatNumber(row[header]) || "").padEnd(columnWidths[i])
      )
      .join(" | ") +
    " |"

  const headerRow = createRow(Object.fromEntries(headers.map((h) => [h, h])))
  const separatorRow =
    "+-" + columnWidths.map((width) => "-".repeat(width)).join("-+-") + "-+"

  const dataRows = data.map((row) => createRow(row))

  const table = [
    separatorRow,
    headerRow,
    separatorRow,
    ...dataRows,
    separatorRow,
  ].join("\n")

  return table
}

export const handleUnlikeApi = async (
  msgId,
  conversationHistory,
  IdConversation,
  idPrompt
) => {
  const payload = {
    conversationHistory: conversationHistory.slice(-3),
    conversationId: IdConversation,
    msgId,
    dataTime: getCurrentDateTime(),
    idPrompt,
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    }

    const response = await fetch(`${API_URL}/unlike/new`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("Failed to unlike the message:", response.statusText)
      return null
    }

    return response
  } catch (error) {
    console.error("Error in unliking message:", error)
    throw error
  }
}

export const getCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
