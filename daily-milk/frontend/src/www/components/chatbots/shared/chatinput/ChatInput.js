import React, { useState } from "react"
import { getCookie } from "../../chat-poulin/utils"
import "./ChatInput.css"

const ChatInput = ({
  inputValue,
  setInputValue,
  isLoading,
  handleSend,
  handleQuickReply,
  onClickMicro,
  isMenuVisible,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [, setTranscript] = useState("")

  const stopListening = () => {
    setIsRecording(false)
    // Non è necessario fermare il riconoscimento qui, poiché gestiamo l'evento onend
  }

  const startListening = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)()
    let language = getCookie("selectedLanguage") || "es-ES"
    recognition.lang = language
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript // Ottieni il testo trascritto
      handleSend(result) // Aggiorna il campo di input con la trascrizione
    }

    recognition.onerror = (event) => {
      console.error("Errore di riconoscimento:", event.error)
    }

    recognition.onend = () => {
      if (isRecording) {
        // Riavvia il riconoscimento se è ancora in corso la registrazione
        recognition.start()
      } else {
        setIsRecording(false) // Assicurati di aggiornare lo stato se l'utente ha fermato manualmente
      }
    }

    recognition.start()
    setIsRecording(true)
  }

  const handleMicroClick = () => {
    onClickMicro()

    if (isRecording) {
      stopListening()
    } else {
      startListening()
      setCountdown(60)
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            stopListening()

            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const handleSendClick = () => {
    handleSend(inputValue)
    setTranscript("")
    setInputValue("")
  }

  return (
    <div className="chat-input input-group">
      <textarea
        className="form-control input-wide"
        placeholder="Type a message..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isLoading}
        rows={2} // Puoi modificare questo valore per impostare la dimensione del textarea
      />
      <div className="input-group-append">
        <button
          className="btn btn-primary"
          onClick={handleSendClick}
          disabled={isLoading}
        >
          Send
        </button>
        <div>
          <button
            className="btn btn-primary btn-wide"
            onClick={handleMicroClick}
            disabled={isLoading}
          >
            {isRecording ? (
              <span>
                <span className="recording-icon" style={{ color: "red" }}>
                  ●
                </span>
                {countdown}
              </span>
            ) : (
              "Micro"
            )}
          </button>
        </div>

        {isMenuVisible && (
          <button
            className="btn btn-primary btn-wide btn-menu"
            onClick={() => handleQuickReply("Menu")}
          >
            Menu
          </button>
        )}
      </div>
    </div>
  )
}

export default ChatInput
