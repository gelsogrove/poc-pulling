import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import React from "react"

const PrintSection = () => {
  const generatePDF = () => {
    const content = document.querySelector(".chat-messages")
    html2canvas(content, { scale: 2 }).then((canvas) => {
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = canvas.width / 2 // High-quality scaling
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(canvas, "PNG", 0, position, pdfWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas, "PNG", 0, position, pdfWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save("chat_messages.pdf")
    })
  }

  return (
    <button
      onClick={generatePDF}
      className="print-popup btn hover-effect"
      title="Print to PDF"
    >
      <i className="fa-solid fa-print icon"></i>
    </button>
  )
}

export default PrintSection
