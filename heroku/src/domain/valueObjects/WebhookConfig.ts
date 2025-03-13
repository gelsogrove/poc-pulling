/**
 * Oggetto di valore che rappresenta la configurazione del webhook
 * Contiene tutte le informazioni necessarie per l'interazione con il servizio di messaggistica esterno
 */
export interface WebhookConfig {
  /** Indica se il webhook è abilitato */
  enabled: boolean
  /** Token di verifica per la validazione delle richieste in entrata */
  verifyToken: string
  /** Token di autenticazione per le richieste in uscita */
  bearerToken: string
  /** URL base dell'API del servizio esterno */
  apiUrl: string
  /** ID del mittente per le richieste in uscita */
  senderId: string
}

/**
 * Funzione factory per creare un oggetto WebhookConfig
 * @param config - Configurazione parziale del webhook
 * @returns Oggetto WebhookConfig completo
 */
export function createWebhookConfig(
  config: Partial<WebhookConfig>
): WebhookConfig {
  return {
    enabled: config.enabled ?? false,
    verifyToken: config.verifyToken ?? "",
    bearerToken: config.bearerToken ?? "",
    apiUrl: config.apiUrl ?? "",
    senderId: config.senderId ?? "",
  }
}

/**
 * Funzione per validare una configurazione webhook
 * @param config - Configurazione del webhook da validare
 * @returns true se la configurazione è valida, false altrimenti
 */
export function isWebhookConfigValid(config: WebhookConfig): boolean {
  if (!config.enabled) return true // Se disabilitato, è sempre valido

  // Se abilitato, verifica che tutti i campi necessari siano presenti
  return (
    !!config.verifyToken &&
    !!config.bearerToken &&
    !!config.apiUrl &&
    !!config.senderId
  )
}
