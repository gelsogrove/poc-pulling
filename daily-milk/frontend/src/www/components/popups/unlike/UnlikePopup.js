import React, { useEffect } from "react"
import { fetchUnlikeData } from "../api/unlike_api"

const UnlikePopup = () => {
  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchUnlikeData()
        console.log("Fetched Data:", data)
      } catch (error) {
        console.error("Error in UnlikePopup:", error)
      }
    }

    getData()
  }, [])

  return (
    <div>
      <h3>Unlike Popup</h3>
      <p>Check the console for fetched data.</p>
    </div>
  )
}

export default UnlikePopup
