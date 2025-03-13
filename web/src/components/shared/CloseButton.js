import React from "react"

const CloseButton = ({ onClose }) => {
  return (
    <button className="btn-circle" onClick={onClose} title="Close">
      <i className="fa-solid fa-close icon"></i>
    </button>
  )
}

export default CloseButton
