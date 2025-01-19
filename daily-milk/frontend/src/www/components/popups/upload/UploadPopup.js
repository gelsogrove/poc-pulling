import "codemirror/lib/codemirror.css" // CSS per l'editor
import "codemirror/mode/javascript/javascript" // Puoi usare un altro linguaggio se necessario
import "codemirror/theme/dracula.css" // Tema dell'editor
import React from "react"
import "./UploadPopup.css"

const UploadPopup = ({ onClose }) => {
  const [, setFileNames] = React.useState([]) // Stato per memorizzare i nomi dei file

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const files = event.dataTransfer.files

    // Aggiorna lo stato con i nomi dei file
    const names = Array.from(files).map((file) => file.name)
    setFileNames(names)
  }

  const handleFileChange = (event) => {
    const files = event.target.files
    const names = Array.from(files).map((file) => file.name)
    setFileNames(names)
  }

  const handleDragOver = (event) => {
    event.preventDefault() // Impedisce il comportamento predefinito
    event.stopPropagation() // Ferma la propagazione dell'evento
  }

  return (
    <div className="prompts-form-container">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h3> UploadPopup</h3>
      <br />
      <br />
      <div
        className="drop-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById("file-input").click()} // Apre il file browser al click
      >
        select the file to import
      </div>
      <input
        type="file"
        id="file-input"
        style={{ display: "none" }} // Nasconde l'input file
        multiple
        onChange={handleFileChange}
      />

      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </div>
  )
}

export default UploadPopup
