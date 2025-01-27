import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/backup`

export const downloadBackup = async () => {
  const token = Cookies.get("token") // Ottieni il token dai cookie

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  try {
    // Effettua la richiesta GET per il backup
    const response = await axios.get(`${API_URL}`, {
      headers,
      responseType: "blob", // Importante per scaricare file binari
    })

    // Crea un URL per il file zippato e attiva il download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${Date.now()}_backup.zip`) // Nome del file scaricato
    document.body.appendChild(link)
    link.click()
    link.remove()

    return true // Ritorna true in caso di successo
  } catch (error) {
    console.error("Error during backup:", error)
    return false // Ritorna false in caso di errore
  }
}

export const uploadBackup = async (file) => {
  const token = Cookies.get("token") // Ottieni il token dai cookie

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const formData = new FormData()
  formData.append("file", file)

  try {
    // Effettua la richiesta POST per l'import
    await axios.post(`${API_URL}/import`, formData, {
      headers,
    })

    return true // Ritorna true in caso di successo
  } catch (error) {
    console.error("Error during import:", error)
    return false // Ritorna false in caso di errore
  }
}
