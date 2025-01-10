const fs = require("fs")
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

// Function to convert data to MySQL-compatible SQL INSERT statements
function generateSql(customers) {
  let sql = ""

  customers.forEach((customer) => {
    // Insert customer
    sql += `INSERT INTO customers (customer_id, name, class, salesperson, user_id, page) VALUES ('${
      customer.customer_id
    }', '${customer.name.replace(/'/g, "''")}', '${
      customer.class
    }', '${customer.salesperson.replace(/'/g, "''")}', '${
      customer.user_id || "NULL"
    }', ${customer.page});\n`

    // Insert order
    if (customer.order_date) {
      sql += `INSERT INTO orders (customer_id, order_date_start, order_date_end, total_quantity, total_price) VALUES ('${customer.customer_id}', '${customer.order_date.startDate}', '${customer.order_date.endDate}', ${customer.total_quantity}, ${customer.total_price});\n`
    }

    // Insert items
    customer.items.forEach((item) => {
      sql += `INSERT INTO items (order_id, item_number, description, quantity, price, page) VALUES ((SELECT id FROM orders WHERE customer_id = '${
        customer.customer_id
      }' ORDER BY id DESC LIMIT 1), '${
        item.item_number
      }', '${item.description.replace(/'/g, "''")}', ${item.quantity}, ${
        item.price
      }, ${item.page});\n`
    })
  })

  return sql
}

// Function to extract data from the PDF
async function extractDataFromPdf(pdfPath) {
  const fileBuffer = fs.readFileSync(pdfPath)
  const pdfData = await pdfParse(fileBuffer)
  const customers = []

  let pageNumber = 1
  const pages = pdfData.text.split("\f")

  for (const page of pages) {
    console.log(`Processing page ${pageNumber}`)
    const pageCustomers = parseCustomerData(page, pageNumber)
    customers.push(...pageCustomers)
    pageNumber++
  }

  return customers
}

// File paths
const inputPdfPath = "Sept24.pdf" // Input PDF file
const outputSqlPath = "output.sql" // Output SQL file

// Execute the process
extractDataFromPdf(inputPdfPath)
  .then((customers) => {
    if (customers.length === 0) {
      console.log("No customers found.")
    } else {
      const sql = generateSql(customers)
      fs.writeFileSync(outputSqlPath, sql, "utf8")
      console.log(`SQL file successfully generated: ${outputSqlPath}`)
    }
  })
  .catch((err) => {
    console.error("Error during PDF extraction:", err)
  })
