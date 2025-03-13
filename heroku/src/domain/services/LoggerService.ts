/**
 * Servizio di logging per il dominio
 * Fornisce metodi per registrare eventi e messaggi con timestamp
 */
export class LoggerService {
  /**
   * Registra un messaggio di log con timestamp
   * @param type - Tipo di log (INFO, ERROR, WARNING, ecc.)
   * @param message - Messaggio da registrare
   * @param details - Dettagli aggiuntivi (opzionale)
   */
  static log(type: string, message: string, details?: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [WEBHOOK] [${type}]: ${message}`)
    if (details) {
      console.log(JSON.stringify(details, null, 2))
    }
  }

  /**
   * Registra un messaggio informativo
   * @param message - Messaggio da registrare
   * @param details - Dettagli aggiuntivi (opzionale)
   */
  static info(message: string, details?: any): void {
    this.log("INFO", message, details)
  }

  /**
   * Registra un messaggio di errore
   * @param message - Messaggio da registrare
   * @param details - Dettagli aggiuntivi (opzionale)
   */
  static error(message: string, details?: any): void {
    this.log("ERROR", message, details)
  }

  /**
   * Registra un messaggio di avviso
   * @param message - Messaggio da registrare
   * @param details - Dettagli aggiuntivi (opzionale)
   */
  static warning(message: string, details?: any): void {
    this.log("WARNING", message, details)
  }

  /**
   * Registra un messaggio di debug
   * @param message - Messaggio da registrare
   * @param details - Dettagli aggiuntivi (opzionale)
   */
  static debug(message: string, details?: any): void {
    this.log("DEBUG", message, details)
  }
}
