import React, { useState } from "react"
import { Controlled as ControlledEditor } from "react-codemirror2"
import "./SettingsPopup.css"

const SettingsPopup = ({ onClose }) => {
  const [logoPreview, setLogoPreview] = useState(null)
  const [editorContent, setEditorContent] = useState("")
  const [temperature, setTemperature] = useState(1.0)

  const handleLogoChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    // Implementa la logica per salvare i dati
  }

  return (
    <div className="settings-popup">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      <div className="settings-popup-content">
        <div className="left-column">
          <h2>WhatsApp Channel Settings</h2>
          <form className="settings-form">
            <table>
              <tbody style={{ minWidth: "500px", overflowY: "auto" }}>
                <tr>
                  <td>
                    <label>WhatsApp Name:</label>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="whatsappName"
                      className="form-input"
                      placeholder="Enter WhatsApp name"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>WhatsApp Logo:</label>
                  </td>
                  <td>
                    <input
                      type="file"
                      name="whatsappLogo"
                      className="form-input"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        style={{ width: "100px", height: "auto" }}
                      />
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>WhatsApp Phone Number:</label>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="whatsappPhoneNumber"
                      className="form-input"
                      placeholder="Enter phone number"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Twilio APIKEY:</label>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="twilioApiKey"
                      className="form-input"
                      placeholder="Enter Twilio APIKEY"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Openrouter APIKEY:</label>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="openrouterApiKey"
                      className="form-input"
                      placeholder="Enter Openrouter APIKEY"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Save Conversations:</label>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      name="saveConversation"
                      className="form-checkbox"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Website Link:</label>
                  </td>
                  <td>
                    <input
                      type="url"
                      name="websiteLink"
                      className="form-input"
                      placeholder="Enter website link"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>WhatsApp Description:</label>
                  </td>
                  <td>
                    <textarea
                      name="whatsappDescription"
                      className="form-input"
                      placeholder="Enter WhatsApp description"
                      rows="4"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Model:</label>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="model"
                      className="form-input"
                      placeholder="Enter model"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Temperature:</label>
                  </td>
                  <td>
                    <input
                      type="range"
                      name="temperature"
                      className="form-input"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
        </div>
        <div className="right-column editor-container">
          <h2>generic prompt</h2>
          <ControlledEditor
            className="custom-codemirror-editor"
            value={editorContent}
            onBeforeChange={(editor, data, value) => {
              setEditorContent(value)
            }}
            options={{
              lineNumbers: true,
              mode: "json",
              theme: "dracula",
              lineWrapping: true,
              scrollbarStyle: "native",
              viewportMargin: Infinity,
            }}
          />
        </div>
      </div>
      <div className="save-button-container">
        <button className="save-button" onClick={handleSave}>
          Save settings
        </button>
      </div>
    </div>
  )
}

export default SettingsPopup
