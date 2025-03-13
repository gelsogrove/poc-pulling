# Refactoring a Domain-Driven Design

Questo documento descrive il refactoring dell'applicazione Poulin Webhook Service secondo i principi del Domain-Driven Design (DDD).

## Struttura Precedente vs Nuova Struttura

### Struttura Precedente

La struttura precedente era organizzata in modo funzionale, con file e cartelle raggruppati per funzionalità senza una chiara separazione dei concetti di dominio:

```
src/
├── poulin/
│   ├── chatbots/
│   │   ├── main/
│   │   │   ├── webhook-service.ts
│   │   │   ├── webhook-config.ts
│   │   │   ├── webhook-router.ts
│   │   │   └── ...
│   │   └── sales-reader/
│   ├── share/
│   └── utility/
└── ...
```

### Nuova Struttura (DDD)

La nuova struttura segue i principi del Domain-Driven Design, con una chiara separazione dei layer:

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

## Principali Miglioramenti

1. **Separazione dei Concetti**: Ogni layer ha una responsabilità ben definita.
2. **Inversione delle Dipendenze**: Le dipendenze puntano verso il dominio, non viceversa.
3. **Testabilità**: La struttura facilita la scrittura di test unitari e di integrazione.
4. **Manutenibilità**: Il codice è più facile da mantenere e estendere.
5. **Documentazione**: Ogni componente è ben documentato con commenti JSDoc.

## Componenti Principali

### Domain Layer

- **Message.ts**: Definisce le entità di dominio per i messaggi in entrata e in uscita.
- **Prompt.ts**: Definisce le entità di dominio per i prompt utilizzati dai modelli LLM.
- **IMessageRepository.ts**: Interfaccia per il repository dei messaggi.
- **IPromptRepository.ts**: Interfaccia per il repository dei prompt.
- **ILLMService.ts**: Interfaccia per il servizio di interazione con i modelli LLM.
- **LoggerService.ts**: Servizio di logging per il dominio.
- **WebhookConfig.ts**: Oggetto di valore per la configurazione del webhook.

### Application Layer

- **MessageDto.ts**: DTO per i messaggi in entrata e in uscita.
- **VerifyWebhookUseCase.ts**: Caso d'uso per la verifica del webhook.
- **ReceiveMessageUseCase.ts**: Caso d'uso per la ricezione dei messaggi.
- **SendMessageUseCase.ts**: Caso d'uso per l'invio dei messaggi.

### Infrastructure Layer

- **MessageRepository.ts**: Implementazione del repository dei messaggi.
- **PromptRepository.ts**: Implementazione del repository dei prompt.
- **LLMService.ts**: Implementazione del servizio LLM.
- **WebhookConfigService.ts**: Servizio per la gestione della configurazione del webhook.
- **database.ts**: Configurazione del database.
- **dependencyInjection.ts**: Configurazione delle dipendenze.

### Interfaces Layer

- **WebhookController.ts**: Controller per la gestione delle richieste webhook.
- **webhookRoutes.ts**: Definizione delle rotte per il webhook.

## Miglioramenti Specifici

1. **Gestione degli Errori**: Migliorata la gestione degli errori con logging dettagliato.
2. **Configurazione**: Centralizzata la configurazione del webhook.
3. **Logging**: Implementato un servizio di logging centralizzato.
4. **Dependency Injection**: Implementato un sistema di iniezione delle dipendenze.
5. **Documentazione**: Aggiunta documentazione JSDoc a tutte le funzioni e classi.

## Funzionalità Rimosse

Come richiesto, sono state rimosse le seguenti funzionalità:

1. CRUD per "unlike"
2. Sales-reader

## Conclusione

Il refactoring ha trasformato l'applicazione in una struttura più robusta, manutenibile e testabile, seguendo i principi del Domain-Driven Design. La nuova struttura facilita l'estensione dell'applicazione con nuove funzionalità e la manutenzione del codice esistente.
