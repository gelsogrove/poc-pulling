===================== TODO =====================

- la stampa non funziona
- checbpx chatbot per ogni role
- tabella dei chatbots disponibili openrouter
- tabla role
- settings basic info
- loop su chatbots!

---FILE --------

- dove metto i file statici?
- catalogo di prodotti
- aggiornare backup
- carica i file sul chatbots

**\_\_\_\_**NICE TO HAVE**\_\_\_\_**

- non mi piace la configurazione modalit'a popup
- prompt componente potrebbe avere un tab
- freccetto rossa non mi piace
- mettere un po di tooltips
- come gestiamo no surprice ne Heroku ?
- pulire test folder perche' c'e import

- **\*** DAILYMILK\***\*\*\*\***
- pulire codice funzioni dengfo utils
- LOGIN WITH DAILIYMILK (todo)
- upload (todo)
- togliere page dall'import e dalla tabella
- user admin e user normale
- BE DI DAIRY-TOLLS mettere allow only from localhost o mio desarrollo

===================== AI COSTI =====================
8 euroku
5 database
...openrouter (50 euro)

===================== COMANDI HREOKU =====================

heroku logs --tail --app poulin
heroku restart -a poulin
heroku run bash -a poulin
heroku pg:psql HEROKU_POSTGRESQL_AMBER_URL -a poulin
heroku logs --tail --app poulin heroku restart -a poulin

mport command: PGPASSWORD=p7e2d963d16a98f0b61439338891882296ed3519cceb6728b0c6b2f9fbc6ed3bd psql -U u4k452g6ek8tnl -h c5p86clmevrg5s.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com -p 5432 -d dc2879l0jk2mj2 -c "\i '/tmp/Poulin_Grain_20250204.sql'"

heroku run "PGPASSWORD=p7e2d963d16a98f0b61439338891882296ed3519cceb6728b0c6b2f9fbc6ed3bd psql -U u4k452g6ek8tnl -h c5p86clmevrg5s.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com -p 5432 -d dc2879l0jk2mj2 -c '\i /tmp/Poulin_Grain_20250204.sql'"

# Frontend Application

Questa è l'applicazione frontend del progetto, ristrutturata secondo i principi moderni di sviluppo React.

## Struttura del Progetto

```
web/
├── public/            # Asset statici e index.html
└── src/
    ├── components/    # Componenti riutilizzabili
    │   ├── ui/        # Componenti di UI di base (button, input, etc.)
    │   ├── layouts/   # Layout components (header, footer, etc.)
    │   ├── features/  # Componenti specifici di feature
    │   └── shared/    # Componenti condivisi specifici dell'applicazione
    ├── pages/         # Componenti a livello di pagina
    ├── hooks/         # Custom React hooks
    ├── contexts/      # React context providers
    ├── controllers/   # Logic controllers per connettere UI e servizi
    ├── services/      # Servizi per API, autenticazione, etc.
    │   └── api/       # Chiamate API organizzate per entità
    ├── utils/         # Funzioni di utilità
    │   └── i18n/      # Internazionalizzazione
    ├── styles/        # Stili globali, variabili, mixins
    ├── assets/        # Immagini, font, etc.
    ├── config/        # Configurazioni dell'app
    └── App.js         # Componente principale
```

## Tecnologie Utilizzate

- React
- React Router
- Axios per le chiamate API
- i18next per l'internazionalizzazione

## Sviluppo

1. Installa le dipendenze:

   ```
   npm install
   ```

2. Avvia il server di sviluppo:

   ```
   npm start
   ```

3. Compila per la produzione:
   ```
   npm run build
   ```

## Architettura

L'applicazione segue un'architettura basata su:

- **Componenti**: Elementi UI riutilizzabili
- **Pagine**: Componenti a livello di pagina
- **Servizi**: Logica di business e chiamate API
- **Hooks**: Logica riutilizzabile per i componenti
- **Contexts**: Stato globale dell'applicazione
- **Controllers**: Connessione tra UI e servizi

## API

Le chiamate API sono organizzate per entità e centralizzate nella cartella `services/api`. Ogni entità ha il suo file o cartella dedicata.
