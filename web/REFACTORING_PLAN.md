# Piano di Refactoring Frontend

## Struttura delle cartelle

Riorganizzeremo il frontend secondo questa struttura:

```
web/
├── public/            # Asset statici e index.html
└── src/
    ├── components/    # Componenti riutilizzabili
    │   ├── ui/        # Componenti di UI di base (button, input, etc.)
    │   ├── layouts/   # Layout components (header, footer, etc.)
    │   └── shared/    # Componenti condivisi specifici dell'applicazione
    ├── pages/         # Componenti a livello di pagina
    ├── hooks/         # Custom React hooks
    ├── contexts/      # React context providers
    ├── controllers/   # Logic controllers per connettere UI e servizi
    ├── services/      # Servizi per API, autenticazione, etc.
    │   └── api/       # Chiamate API organizzate per entità
    ├── utils/         # Funzioni di utilità
    ├── styles/        # Stili globali, variabili, mixins
    ├── assets/        # Immagini, font, etc.
    ├── config/        # Configurazioni dell'app
    └── App.js         # Componente principale
```

## Piano di migrazione

### Fase 1: Riorganizzazione della struttura

1. **Migrazione dei componenti**:

   - Spostare i componenti da `www/components` a `components`
   - Organizzare in sottocartelle (`ui`, `layouts`, ecc.)

2. **Migrazione delle pagine**:

   - Spostare le pagine da `www/pages` a `pages`

3. **Estrazione dei servizi**:

   - Spostare le chiamate API da `*/api/` a `services/api/`
   - Creare servizi separati per autenticazione, gestione dati, ecc.

4. **Creazione dei controllers**:

   - Creare controllers per connettere UI e servizi
   - Spostare la logica di business dai componenti ai controllers

5. **Estrazione degli hooks**:

   - Creare custom hooks per logica riutilizzabile
   - Spostare logica dai componenti agli hooks

6. **Creazione dei contexts**:
   - Creare context providers per stato globale
   - Spostare lo stato dai componenti ai contexts

### Fase 2: Rimozione dei riferimenti a "poulin"

1. Sostituire tutti i riferimenti a "poulin" nel codice
2. Aggiornare le URL delle API
3. Rimuovere percorsi che includono "poulin/"

### Fase 3: Miglioramenti e modernizzazione

1. Standardizzare l'uso dei componenti
2. Migliorare la gestione degli errori
3. Implementare lazy loading per i componenti pesanti
4. Ottimizzare le performance

## Mappatura delle cartelle attuali alle nuove

| Cartella Attuale        | Nuova Cartella               |
| ----------------------- | ---------------------------- |
| www/components/navbar   | components/layouts/Navbar    |
| www/components/footer   | components/layouts/Footer    |
| www/components/chatbots | components/features/Chatbots |
| www/components/popups   | components/features/Modals   |
| www/components/share    | components/shared            |
| www/pages               | pages                        |
| www/config              | config                       |
| www/i18n                | utils/i18n                   |
| \*/api                  | services/api                 |
