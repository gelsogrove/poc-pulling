import React, { useState } from "react"
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
  const [, setTranscript] = useState("")

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
          className="btn btn-primary btn-wide"
          onClick={handleSendClick}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInput
