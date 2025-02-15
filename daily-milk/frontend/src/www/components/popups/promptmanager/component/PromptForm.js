import React from "react"
import "./PromptForm.css"

const PromptForm = ({
  prompt,
  handleInputChange,
  handleSave,
  handleCancel,
  models, // array di modelli disponibili
}) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5000000) {
        // 5MB limit
        alert("File is too large. Maximum size is 5MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        handleInputChange({
          target: {
            name: "image",
            value: reader.result,
          },
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="prompt-form-container">
      <div className="prompt-form-grid">
        <div className="prompt-form-field">
          <label className="prompt-form-required">Name</label>
          <input
            type="text"
            name="promptname"
            value={prompt.promptname || ""}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="prompt-form-field">
          <label className="prompt-form-required">Model</label>
          <select
            name="model"
            value={prompt.model || ""}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Model</option>
            {models.map((model) => (
              <option key={model.idmodel} value={model.model}>
                {model.model}
              </option>
            ))}
          </select>
        </div>

        <div className="prompt-form-field">
          <label className="prompt-form-required">Temperature</label>
          <input
            type="number"
            name="temperature"
            value={prompt.temperature || ""}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            max="1"
            required
          />
        </div>

        <div className="prompt-form-field">
          <label className="prompt-form-required">Path</label>
          <input
            type="text"
            name="path"
            value={prompt.path || ""}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="prompt-form-textarea">
          <label className="prompt-form-required">Prompt</label>
          <textarea
            name="prompt"
            value={prompt.prompt || ""}
            onChange={handleInputChange}
            required
            rows={10}
          />
        </div>

        <div className="form-group">
          <label className="prompt-form-label">
            Immagine Chatbot:
            <div className="image-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="image-upload-input"
              />
              {prompt.image && (
                <div className="image-preview-container">
                  <img
                    src={prompt.image}
                    alt="Preview"
                    className="image-preview"
                  />
                  <button
                    className="remove-image"
                    onClick={() =>
                      handleInputChange({
                        target: {
                          name: "image",
                          value: "/images/chatbot.webp",
                        },
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="prompt-form-actions">
        <button className="prompt-form-button cancel" onClick={handleCancel}>
          &#171; Cancel
        </button>
        <button className="prompt-form-button save" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  )
}

export default PromptForm
