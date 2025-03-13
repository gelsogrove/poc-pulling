# Poulin Webhook Service

Servizio webhook per Poulin con architettura Domain-Driven Design (DDD).

## Struttura del Progetto

Il progetto è organizzato secondo i principi del Domain-Driven Design (DDD), con una chiara separazione dei layer:

- **Domain**: Contiene le entità di dominio, le interfacce dei repository e i servizi di dominio.
- **Application**: Contiene i casi d'uso dell'applicazione e i DTO.
- **Infrastructure**: Contiene le implementazioni concrete dei repository e dei servizi.
- **Interfaces**: Contiene i controller, le rotte e i middleware per l'interazione con l'esterno.

### Struttura delle Cartelle

```
src/
├── domain/
│   ├── models/           # Entità e oggetti di valore del dominio
│   ├── repositories/     # Interfacce dei repository
│   ├── services/         # Servizi di dominio
│   └── valueObjects/     # Oggetti di valore
├── application/
│   ├── dtos/             # Data Transfer Objects
│   ├── services/         # Servizi applicativi
│   └── useCases/         # Casi d'uso
├── infrastructure/
│   ├── config/           # Configurazioni
│   ├── database/         # Configurazione del database
│   ├── repositories/     # Implementazioni dei repository
│   └── services/         # Implementazioni dei servizi
└── interfaces/
    ├── api/              # API e rotte
    ├── controllers/      # Controller
    └── middlewares/      # Middleware
```

## Funzionalità Principali

- **Webhook per WhatsApp**: Gestisce la ricezione e l'invio di messaggi tramite l'API di WhatsApp.
- **Integrazione con LLM**: Utilizza modelli di linguaggio per generare risposte ai messaggi.
- **Gestione dei Prompt**: Permette di configurare e utilizzare diversi prompt per i modelli LLM.

## Configurazione

Il servizio utilizza variabili d'ambiente per la configurazione. Crea un file `.env` nella radice del progetto con le seguenti variabili:

```
# Configurazione del server
PORT=4999
NODE_ENV=development

# Configurazione del database
DATABASE_URL=postgres://username:password@localhost:5432/database

# Configurazione del webhook
CHATBOT_WEBHOOK_ENABLED=true
CHATBOT_WEBHOOK_VERIFY_TOKEN=your_verify_token
CHATBOT_WEBHOOK_BEARER_TOKEN=your_bearer_token
CHATBOT_WEBHOOK_API_URL=https://graph.facebook.com/v22.0
CHATBOT_WEBHOOK_SENDER_ID=your_sender_id

# Configurazione OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Installazione e Avvio

1. Clona il repository
2. Installa le dipendenze: `npm install`
3. Compila il codice TypeScript: `npm run build`
4. Avvia il server: `npm start`

Per lo sviluppo, puoi utilizzare: `npm run dev`

## Endpoint API

- `GET /webhook`: Endpoint per la verifica del webhook da parte di WhatsApp.
- `POST /webhook`: Endpoint per la ricezione dei messaggi da WhatsApp.
- `POST /webhook/send`: Endpoint per l'invio di messaggi tramite WhatsApp.

## Licenza

Questo progetto è proprietario e confidenziale.
