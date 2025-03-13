/**
 * Utility per la formattazione e la visualizzazione dei dati di chat
 */

/**
 * Crea una tabella ASCII dinamica dai dati forniti
 * @param {Array} data - Array di oggetti da visualizzare in formato tabella
 * @returns {string} Tabella ASCII formattata
 */
export const createDynamicAsciiTable = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available..."
  }

  // Campi da non formattare
  const nonFormattedFields = ["item_number", "description"]

  const headers = Object.keys(data[0])

  const formatNumber = (header, value) => {
    // Evita la formattazione dei campi specificati
    if (nonFormattedFields.includes(header)) {
      return value
    }
    // Applica la formattazione solo ai valori numerici
    if (!isNaN(value) && value !== null && value !== "") {
      return parseFloat(value).toLocaleString("it-IT")
    }
    return value
  }

  const columnWidths = headers.map((header) =>
    Math.max(
      header.length,
      ...data.map(
        (row) => String(formatNumber(header, row[header]) || "").length
      )
    )
  )

  const createRow = (row) =>
    "| " +
    headers
      .map((header, i) =>
        String(formatNumber(header, row[header]) || "").padEnd(columnWidths[i])
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
