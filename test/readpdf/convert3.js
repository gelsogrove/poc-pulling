const fs = require("fs")
const path = require("path")
const pdfParse = require("pdf-parse")

let globalOrderDate = null // To store the last encountered order date

// Function to format dates to YYYY-MM-DD
function formatDate(date) {
  const [month, day, year] = date.split("/") // Cambiato ordine
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

// Function to parse customer data from the text of a single page
function parseCustomerData(text, pageNumber) {
  const lines = text.split("\n")
  const customers = []
  let customer = null

  for (const line of lines) {
    // Recognize and store the order date globally
    const orderDateMatch = line.match(
      /Order Date\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})/
    )
    if (orderDateMatch) {
      const [_, startDate, endDate] = orderDateMatch
      globalOrderDate = {
        raw: `${startDate} - ${endDate}`,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      }
    }

    // Detect a new customer section
    const customerMatch = line.match(
      /^(\w+)\s+(.+?)\s+(KEYM4|RETAIL|WHOLESALE)\s+(.+)/
    )
    if (customerMatch) {
      if (customer) {
        customers.push(customer) // Save the previous customer
      }
      customer = {
        customer_id: customerMatch[1],
        name: customerMatch[2].trim(),
        class: customerMatch[3],
        salesperson: customerMatch[4].trim(),
        items: [],
        total_quantity: 0,
        total_price: 0,
        order_date: globalOrderDate,
        user_id: null, // Field for user ID
        page: pageNumber,
      }
    }

    // Recognize the user ID
    const userIdMatch = line.match(/User ID:\s+(\w+)/)
    if (userIdMatch && customer) {
      customer.user_id = userIdMatch[1]
    }

    // Recognize item details
    const itemMatch = line.match(
      /^\s*(\w+)\s+(.+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/
    )
    if (itemMatch && customer) {
      const [_, item_number, description, quantity, price] = itemMatch
      customer.items.push({
        item_number,
        description: description.trim(),
        quantity: parseFloat(quantity.replace(/,/g, "")),
        price: parseFloat(price.replace(/,/g, "")),
        page: pageNumber,
      })
    }

    // Recognize customer totals
    const totalsMatch = line.match(
      /Customer Totals:\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/
    )
    if (totalsMatch && customer) {
      customer.total_quantity = parseFloat(totalsMatch[1].replace(/,/g, ""))
      customer.total_price = parseFloat(totalsMatch[2].replace(/,/g, ""))
    }
  }

  if (customer) {
    customers.push(customer) // Push the last customer
  }

  return customers
}

// Function to generate SQL queries
function generateSql(customers) {
  let sql = ""

  customers.forEach((customer) => {
    // Add comment for the customer
    if (customer.order_date) {
      // sql += `/***************** CLIENTE ${customer.customer_id} FROM: ${customer.order_date.startDate} TO: ${customer.order_date.endDate} *****************/\n`
    }

    // Add DELETE statements to remove existing data for the customer in the specified period
    if (customer.order_date) {
      sql += `DELETE FROM items WHERE order_id IN (SELECT order_id FROM orders WHERE customer_id = '${customer.customer_id}' AND order_date_start = '${customer.order_date.startDate}' AND order_date_end = '${customer.order_date.endDate}');\n`
      sql += `DELETE FROM orders WHERE customer_id = '${customer.customer_id}' AND order_date_start = '${customer.order_date.startDate}' AND order_date_end = '${customer.order_date.endDate}';\n`
    }

    // Insert order
    if (customer.order_date) {
      sql += `INSERT INTO orders (customer_id, order_date_start, order_date_end, total_quantity, total_price) VALUES ('${customer.customer_id}', '${customer.order_date.startDate}', '${customer.order_date.endDate}', ${customer.total_quantity}, ${customer.total_price});\n`
    }

    // Insert items
    customer.items.forEach((item) => {
      sql += `INSERT INTO items (order_id, item_number, description, quantity, price) VALUES ((SELECT order_id FROM orders WHERE customer_id = '${
        customer.customer_id
      }' AND order_date_start = '${
        customer.order_date.startDate
      }' AND order_date_end = '${
        customer.order_date.endDate
      }' ORDER BY order_id DESC LIMIT 1), '${
        item.item_number
      }', '${item.description.replace(/'/g, "''")}', ${item.quantity}, ${
        item.price
      });\n`
    })
  })

  return sql
}

// Function to extract data from a single PDF
async function extractDataFromPdf(pdfPath) {
  const fileBuffer = fs.readFileSync(pdfPath)
  const pdfData = await pdfParse(fileBuffer)
  const customers = []

  let pageNumber = 1
  const pages = pdfData.text.split("\f")

  for (const page of pages) {
    console.log(`Processing page ${pageNumber} of ${pdfPath}`)
    const pageCustomers = parseCustomerData(page, pageNumber)
    customers.push(...pageCustomers)
    pageNumber++
  }

  return customers
}

// Process all PDFs in a folder
async function processAllPdfs(inputFolder, outputSqlPath) {
  function getAllPdfFiles(dir) {
    let results = []
    const list = fs.readdirSync(dir)
    list.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllPdfFiles(filePath))
      } else if (filePath.endsWith(".pdf")) {
        results.push(filePath)
      }
    })
    return results
  }

  const files = getAllPdfFiles(inputFolder)
  let allCustomers = []
  let processedCount = 0

  for (const file of files) {
    try {
      console.log(`Processing file: ${file}`)
      const customers = await extractDataFromPdf(file)
      allCustomers.push(...customers)
      processedCount++
      console.log(
        `Progress: ${((processedCount / files.length) * 100).toFixed(2)}%`
      )
    } catch (err) {
      console.error(`Error processing file ${file}:`, err)
    }
  }

  if (allCustomers.length === 0) {
    console.log("No customers found in any PDF.")
  } else {
    const sql = generateSql(allCustomers)
    fs.writeFileSync(outputSqlPath, sql, "utf8")
    console.log(`SQL file successfully generated: ${outputSqlPath}`)
    console.log(`Processed ${processedCount}/${files.length} files.`)
  }
}

// File paths
const inputFolder = "salespdf" // Input folder containing PDF files and subfolders
const outputSqlPath = "output.sql" // Output SQL file

// Execute the process
processAllPdfs(inputFolder, outputSqlPath).catch((err) => {
  console.error("Error during PDF processing:", err)
})
