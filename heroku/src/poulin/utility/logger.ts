/**
 * Logger utility for consistent message formatting
 */

type LogType =
  | "INFO"
  | "ERROR"
  | "SUCCESS"
  | "WARN"
  | "DEBUG"
  | "RECEIVE"
  | "SENT"
  | "BUTTON"
  | "SENDING"

export function logMessage(type: LogType, message: string, details?: any) {
  const timestamp = new Date().toISOString()
  const log = `[${timestamp}] ${type}: ${message}`

  console.log(log)
  if (details) {
    console.log(JSON.stringify(details, null, 2))
  }

  // In production, you might want to send logs to a service like Papertrail
  if (process.env.NODE_ENV === "production") {
    // TODO: Add production logging service integration if needed
  }
}
