import React, { useState } from "react"
import "./SettingsPopup.css"

const SettingsPopup = ({ onClose }) => {
  const [logoPreview, setLogoPreview] = useState(null)

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

  return (
    <div className="settings-popup">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      <div className="settings-popup-content">
        <h2>WhatsApp Channel Settings</h2>
        <form className="settings-form">
          <table>
            <tbody>
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
                  <label>Wrapper ID:</label>
                </td>
                <td>
                  <input
                    type="text"
                    name="wrapperId"
                    className="form-input"
                    placeholder="Enter Wrapper ID"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <button type="submit" className="form-button">
            Save
          </button>
        </form>
      </div>
    </div>
  )
}

export default SettingsPopup
