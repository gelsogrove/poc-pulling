const fs = require("fs")
const pdf = require("pdf-parse")

function pdfToTxt(pdfPath, txtPath) {
  // Read the PDF file
  const dataBuffer = fs.readFileSync(pdfPath)

  pdf(dataBuffer)
    .then((data) => {
      // Extract text and write to a TXT file
      fs.writeFileSync(txtPath, data.text, "utf8")
      console.log(`Text extracted and saved to ${txtPath}`)
    })
    .catch((error) => {
      console.error("An error occurred while processing the PDF:", error)
    })
}

// Replace these paths with your file paths
const pdfPath = "demoPulin.pdf" // Path to your PDF file
const txtPath = "import.txt" // Desired output TXT file path

pdfToTxt(pdfPath, txtPath)
