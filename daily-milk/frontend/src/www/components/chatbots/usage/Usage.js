import Cookies from "js-cookie"
import React, { useCallback, useEffect, useState } from "react"
import { fetchUsageData, getPromptDetails } from "./api/utils_api"
import "./Usage.css"

const Usage = ({ idPrompt, IdConversation, refresh }) => {
  const [usageData, setUsageData] = useState(null)
  const [currentChatDifference, setCurrentChatDifference] = useState(0)
  const [temperature, setTemperature] = useState(null)
  const [model, setModel] = useState(null)
  const [, setError] = useState(null)

  const cookieKey = `initialTotal_${IdConversation}` // Chiave univoca per ogni conversazione
  const initialTotalCurrentMonth = parseFloat(Cookies.get(cookieKey) || "0")

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchUsageData()
      setUsageData(data)

      const prompt = await getPromptDetails(idPrompt)
      setTemperature(prompt.temperature)
      setModel(prompt.model)

      // Resetta il valore iniziale se la conversazione è nuova
      if (!Cookies.get(cookieKey)) {
        Cookies.set(cookieKey, data.totalCurrentMonth || 0, { expires: 7 })
        setCurrentChatDifference(0) // Resetta la differenza
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data. Please try again.")
    }
  }, [idPrompt, cookieKey])

  useEffect(() => {
    fetchData()
  }, [fetchData, refresh, idPrompt])

  useEffect(() => {
    if (usageData?.totalCurrentMonth) {
      const difference = usageData.totalCurrentMonth - initialTotalCurrentMonth
      setCurrentChatDifference(difference)
    }
  }, [usageData, initialTotalCurrentMonth])

  return (
    <div className="usage-container">
      {usageData && usageData.error ? (
        <div className="error-message">
          <b>Error:</b>
          <br />
          Request limit reached today :-(
        </div>
      ) : usageData ? (
        <>
          <div className="title-usage"></div>
          <h3>{currentChatDifference.toFixed(2)} $</h3>
          <br />
          Current monthly usage:
          <div>{usageData.totalCurrentMonth} $</div>
          <hr />
          Model:
          <div>{model}</div>
          <hr />
          Temperature:
          <div>{temperature}</div>
          <hr />
          PromptId:
          <div>{idPrompt}</div>
          <hr />
          ConversationId:
          <div>{IdConversation}</div>
          <hr />
        </>
      ) : (
        <div className="loading-message">Loading...</div>
      )}
    </div>
  )
}

export default Usage
