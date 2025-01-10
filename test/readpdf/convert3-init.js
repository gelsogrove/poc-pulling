const fs = require("fs")
const path = require("path")
const pdfParse = require("pdf-parse")

let globalOrderDate = null // To store the last encountered order date

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
        startDate: startDate.split("/").reverse().join("-"),
        endDate: endDate.split("/").reverse().join("-"),
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

function generateSql(customers) {
  let sql = ""
  const processedCustomerIds = new Set() // Set to track unique customer IDs

  customers.forEach((customer) => {
    if (!processedCustomerIds.has(customer.customer_id)) {
      processedCustomerIds.add(customer.customer_id) // Add the customer_id to the Set

      // Insert customer
      sql += `INSERT INTO customers (customer_id, name, class, salesperson, user_id) VALUES ('${
        customer.customer_id
      }', '${customer.name.replace(/'/g, "''")}', '${
        customer.class
      }', '${customer.salesperson.replace(/'/g, "''")}', '${
        customer.user_id || "NULL"
      }');\n`
    }
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
const outputSqlPath = "output-init.sql" // Output SQL file

// Execute the process
processAllPdfs(inputFolder, outputSqlPath).catch((err) => {
  console.error("Error during PDF processing:", err)
})
