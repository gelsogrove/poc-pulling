import React from "react"
import "./QuickReplies.css"

const QuickReplies = ({ quickReplies, handleQuickReply }) => {
  return (
    <div className="quick-reply-buttons d-flex flex-wrap">
      {quickReplies.map((reply, index) => (
        <div key={index} className="col-6 mb-2">
          <button
            className="btn btn-primary btn-wide"
            onClick={() => handleQuickReply(reply)}
          >
            {reply} {/* The reply text from options */}
          </button>
        </div>
      ))}
    </div>
  )
}

export default QuickReplies
