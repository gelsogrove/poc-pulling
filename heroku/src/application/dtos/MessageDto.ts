import {
  IncomingMessage,
  OutgoingMessage,
} from "../../domain/models/Message.js"

/**
 * DTO per i messaggi in entrata
 * Utilizzato per trasferire dati tra i layer dell'applicazione
 */
export interface IncomingMessageDto {
  /** ID univoco del mittente */
  from: string
  /** Contenuto testuale del messaggio */
  text: string
  /** Timestamp di ricezione del messaggio (in millisecondi) */
  timestamp: number
  /** ID univoco del messaggio */
  messageId: string
}

/**
 * DTO per i messaggi in uscita
 * Utilizzato per trasferire dati tra i layer dell'applicazione
 */
export interface OutgoingMessageDto {
  /** ID univoco del destinatario */
  to: string
  /** Contenuto testuale del messaggio */
  text: string
  /** ID di correlazione per tracciare la conversazione (opzionale) */
  correlationId?: string
}

/**
 * Converte un DTO di messaggio in entrata in un modello di dominio
 * @param dto - DTO del messaggio in entrata
 * @returns Modello di dominio del messaggio in entrata
 */
export function toIncomingMessageDomain(
  dto: IncomingMessageDto
): IncomingMessage {
  return {
    from: dto.from,
    text: dto.text,
    timestamp: dto.timestamp,
    messageId: dto.messageId,
  }
}

/**
 * Converte un modello di dominio di messaggio in entrata in un DTO
 * @param domain - Modello di dominio del messaggio in entrata
 * @returns DTO del messaggio in entrata
 */
export function toIncomingMessageDto(
  domain: IncomingMessage
): IncomingMessageDto {
  return {
    from: domain.from,
    text: domain.text,
    timestamp: domain.timestamp,
    messageId: domain.messageId,
  }
}

/**
 * Converte un DTO di messaggio in uscita in un modello di dominio
 * @param dto - DTO del messaggio in uscita
 * @returns Modello di dominio del messaggio in uscita
 */
export function toOutgoingMessageDomain(
  dto: OutgoingMessageDto
): OutgoingMessage {
  return {
    to: dto.to,
    text: dto.text,
    correlationId: dto.correlationId,
  }
}

/**
 * Converte un modello di dominio di messaggio in uscita in un DTO
 * @param domain - Modello di dominio del messaggio in uscita
 * @returns DTO del messaggio in uscita
 */
export function toOutgoingMessageDto(
  domain: OutgoingMessage
): OutgoingMessageDto {
  return {
    to: domain.to,
    text: domain.text,
    correlationId: domain.correlationId,
  }
}
