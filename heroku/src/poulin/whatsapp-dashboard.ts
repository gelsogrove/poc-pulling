import { Request, Response } from "express"
import QRCode from "qrcode"

// Funzione per servire la dashboard di WhatsApp
export function serveDashboard(req: Request, res: Response) {
  // Imposta header CSP appropriati per consentire gli script e gli stili inline
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  )

  res.setHeader("Content-Type", "text/html")
  res.send(dashboardHTML)
}

// Funzione per servire CSS statici
export function serveCSS(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/css")
  res.send(dashboardCSS)
}

// Funzione per servire JavaScript statici
export function serveJS(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/javascript")
  res.send(dashboardJS)
}

// Stili CSS della dashboard
const dashboardCSS = `
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
h1 {
  color: #075e54;
  border-bottom: 2px solid #25d366;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  flex: 1;
  min-width: 300px;
}
.panel h2 {
  color: #075e54;
  margin-top: 0;
  font-size: 1.2rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}
.info-item {
  margin-bottom: 12px;
}
.info-item strong {
  display: inline-block;
  width: 140px;
  font-weight: 600;
}
.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
}
.status-connected {
  background-color: #25d366;
}
.status-disconnected {
  background-color: #ff5252;
}
.status-initialized {
  background-color: #ffbb33;
}
button {
  background-color: #075e54;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;
  transition: background-color 0.3s;
}
button:hover {
  background-color: #128c7e;
}
#qrcode-container {
  text-align: center;
  margin: 20px 0;
  min-height: 300px;
}
#qrcode-container img {
  max-width: 100%;
  height: auto;
}
#logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
}
.log-entry {
  margin-bottom: 4px;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #075e54;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  opacity: 0;
  transition: opacity 0.3s;
}
.toast.show {
  opacity: 1;
}
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  .panel {
    width: 100%;
  }
}
`

// JavaScript della dashboard
const dashboardJS = `
// API endpoints
const API = {
  status: '/whatsapp/status',
  reset: '/whatsapp/reset',
  forceQR: '/whatsapp/force-qr',
  logs: '/whatsapp/logs'
};

// Elementi DOM
let elements;

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
  elements = {
    statusText: document.getElementById('status-text'),
    sessionStatus: document.getElementById('session-status'),
    qrInstruction: document.getElementById('qr-instruction'),
    qrcodeContainer: document.getElementById('qrcode-container'),
    logsContainer: document.getElementById('logs-container'),
    toast: document.getElementById('toast'),
    checkStatusBtn: document.getElementById('check-status-btn'),
    resetBtn: document.getElementById('reset-btn'),
    generateQrBtn: document.getElementById('generate-qr-btn'),
    refreshLogsBtn: document.getElementById('refresh-logs-btn')
  };

  // Registra gli event listener
  elements.checkStatusBtn.addEventListener('click', checkStatus);
  elements.resetBtn.addEventListener('click', resetWhatsApp);
  elements.generateQrBtn.addEventListener('click', generateQR);
  elements.refreshLogsBtn.addEventListener('click', refreshLogs);

  // Inizializza la dashboard
  checkStatus();
  refreshLogs();
});

// Funzione per mostrare un toast
function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.style.backgroundColor = isError ? '#ff5252' : '#075e54';
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// Funzione per aggiornare lo stato
async function checkStatus() {
  try {
    const response = await fetch(API.status);
    const data = await response.json();
    
    // Aggiorna l'interfaccia
    if (data.initialized) {
      elements.sessionStatus.textContent = 'Inizializzata';
    } else {
      elements.sessionStatus.textContent = 'Non inizializzata';
    }
    
    if (data.connected) {
      elements.statusText.innerHTML = '<span class="status-indicator status-connected"></span>Connesso';
    } else if (data.initialized) {
      elements.statusText.innerHTML = '<span class="status-indicator status-initialized"></span>Inizializzato ma non connesso';
    } else {
      elements.statusText.innerHTML = '<span class="status-indicator status-disconnected"></span>Disconnesso';
    }
    
    showToast('Stato aggiornato');
  } catch (error) {
    console.error('Errore nel verificare lo stato:', error);
    showToast('Errore nel verificare lo stato', true);
  }
}

// Funzione per resettare WhatsApp
async function resetWhatsApp() {
  try {
    elements.statusText.innerHTML = '<span class="status-indicator status-disconnected"></span>Disconnessione in corso...';
    const response = await fetch(API.reset);
    const data = await response.json();
    
    if (data.success) {
      showToast('WhatsApp resettato con successo');
      elements.qrInstruction.textContent = 'WhatsApp resettato. Clicca su "Genera QR Code" per ottenere un nuovo codice.';
      elements.qrcodeContainer.innerHTML = '';
    } else {
      showToast('Errore nel reset di WhatsApp: ' + (data.error || 'errore sconosciuto'), true);
    }
    
    // Aggiorna lo stato
    checkStatus();
  } catch (error) {
    console.error('Errore nel reset di WhatsApp:', error);
    showToast('Errore nel reset di WhatsApp', true);
  }
}

// Funzione per generare il QR code
async function generateQR() {
  try {
    elements.qrInstruction.textContent = 'Generazione QR Code in corso...';
    elements.qrcodeContainer.innerHTML = '<p>Attendere, generazione in corso...</p>';
    
    const response = await fetch(API.forceQR);
    const data = await response.json();
    
    if (data.success && data.qrCode) {
      // QR code ricevuto direttamente come stringa
      elements.qrInstruction.textContent = 'Scansiona questo codice QR con WhatsApp (+34654728753):';
      
      // Crea un canvas per il QR code
      const canvas = document.createElement('canvas');
      
      // Usa una libreria QR code lato client per generare l'immagine
      // Dato che non possiamo accedere direttamente a qrcode.js, usiamo un'immagine data URL
      // Qui verrà richiamata un'API per generare il QR code
      const img = document.createElement('img');
      img.src = '/whatsapp/qrcode?data=' + encodeURIComponent(data.qrCode);
      img.alt = 'WhatsApp QR Code';
      img.width = 300;
      
      elements.qrcodeContainer.innerHTML = '';
      elements.qrcodeContainer.appendChild(img);
      
      showToast('QR Code generato con successo');
    } else {
      elements.qrInstruction.textContent = 'Impossibile generare il QR Code. Riprova o controlla i log.';
      elements.qrcodeContainer.innerHTML = '<p>Errore nella generazione: ' + (data.message || data.error || 'Errore sconosciuto') + '</p>';
      showToast('Errore nella generazione del QR Code', true);
      
      // Avvia il polling dei log per vedere se il QR appare nei log
      refreshLogs();
      const logCheckInterval = setInterval(() => {
        refreshLogs();
        // Controlla se nei log c'è il QR code
        const logsText = elements.logsContainer.textContent;
        if (logsText.includes('QRCODE_FORZATO_START') && logsText.includes('QRCODE_FORZATO_END')) {
          clearInterval(logCheckInterval);
          showToast('QR Code trovato nei log!');
        }
      }, 3000);
      
      // Ferma il polling dopo 30 secondi
      setTimeout(() => clearInterval(logCheckInterval), 30000);
    }
  } catch (error) {
    console.error('Errore nella generazione del QR code:', error);
    elements.qrInstruction.textContent = 'Errore nella generazione del QR Code. Riprova.';
    elements.qrcodeContainer.innerHTML = '<p>Errore: ' + error.message + '</p>';
    showToast('Errore nella generazione del QR Code', true);
  }
}

// Funzione per aggiornare i log
async function refreshLogs() {
  try {
    const response = await fetch(API.logs);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.logs)) {
      if (data.logs.length === 0) {
        elements.logsContainer.innerHTML = '<div class="log-entry">Nessun log disponibile.</div>';
      } else {
        elements.logsContainer.innerHTML = data.logs
          .map(log => '<div class="log-entry">' + log + '</div>')
          .join('');
      }
    } else {
      elements.logsContainer.innerHTML = '<div class="log-entry">Errore nel recupero dei log.</div>';
    }
  } catch (error) {
    console.error('Errore nel recupero dei log:', error);
    elements.logsContainer.innerHTML = '<div class="log-entry">Errore: ' + error.message + '</div>';
  }
}
`

// HTML della dashboard
const dashboardHTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard WhatsApp</title>
  <link rel="stylesheet" href="/whatsapp/dashboard.css">
</head>
<body>
  <h1>Dashboard WhatsApp</h1>

  <div class="container">
    <div class="panel">
      <h2>Informazioni</h2>
      <div class="info-item">
        <strong>Numero WhatsApp:</strong> <span id="whatsapp-number">+34654728753</span>
      </div>
      <div class="info-item">
        <strong>Stato:</strong> <span id="status-text"><span class="status-indicator status-disconnected"></span>Disconnesso</span>
      </div>
      <div class="info-item">
        <strong>Sessione:</strong> <span id="session-status">Non inizializzata</span>
      </div>
      <div class="action-buttons">
        <button id="check-status-btn">Verifica Stato</button>
        <button id="reset-btn">Resetta WhatsApp</button>
        <button id="generate-qr-btn">Genera QR Code</button>
      </div>
    </div>

    <div class="panel">
      <h2>QR Code</h2>
      <p id="qr-instruction">Clicca su "Genera QR Code" per ottenere un nuovo codice QR da scansionare con WhatsApp.</p>
      <div id="qrcode-container"></div>
    </div>
  </div>

  <div class="panel">
    <h2>Log Recenti</h2>
    <button id="refresh-logs-btn">Aggiorna Log</button>
    <div id="logs-container">
      <div class="log-entry">Nessun log disponibile. Clicca su "Aggiorna Log" per visualizzare i log più recenti.</div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script src="/whatsapp/dashboard.js"></script>
</body>
</html>`

// Funzione per generare QR code come immagine
export function generateQRImage(req: Request, res: Response) {
  const data = req.query.data as string
  if (!data) {
    res.status(400).send("Dati QR code mancanti")
    return
  }

  QRCode.toDataURL(data, { width: 300 })
    .then((url) => {
      res.setHeader("Content-Type", "image/png")
      // Il data URL è del tipo "data:image/png;base64,..."
      // Estraiamo solo la parte base64
      const base64Data = url.replace(/^data:image\/png;base64,/, "")
      const imageBuffer = Buffer.from(base64Data, "base64")
      res.send(imageBuffer)
    })
    .catch((err) => {
      console.error("Errore nella generazione del QR code:", err)
      res.status(500).send("Errore nella generazione del QR code")
    })
}

// Esporta la funzione principale
export default serveDashboard
