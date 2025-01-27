import { exec } from "child_process"
import { Request, Response, Router } from "express"
import fs from "fs"
import path from "path"
import { validateRequest } from "./validateUser.js"

const backupRouter = Router()

// Funzione per estrarre i dettagli dalla stringa di connessione del database
const parseDatabaseUrl = (url: string) => {
  const regex = /^postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/
  const matches = url.match(regex)

  if (!matches) {
    throw new Error("Invalid database URL")
  }

  return {
    user: matches[1],
    password: matches[2],
    host: matches[3],
    port: matches[4],
    dbname: matches[5],
  }
}

// Handler per scaricare il backup del database
const handleDownloadBackup = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validazione dell'utente prima di procedere
  const userId = await validateRequest(req, res)
  if (!userId) return // Se l'utente non è valido, interrompi l'esecuzione

  const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL // URL del database

  if (!databaseUrl) {
    res.status(500).json({ message: "Database URL is missing" })
    return
  }

  // Estrai i dettagli della connessione dalla stringa di connessione
  let dbUser, dbPassword, dbHost, dbPort, dbName
  try {
    ;({
      user: dbUser,
      password: dbPassword,
      host: dbHost,
      port: dbPort,
      dbname: dbName,
    } = parseDatabaseUrl(databaseUrl))
  } catch (err) {
    res.status(500).json({ message: "Error parsing DATABASE_URL." })
    return
  }

  // Ottieni il nome dell'app dal file .env
  const appName = process.env.APP_NAME || "default" // Se APP_NAME non è definito, usa "default"

  // Genera il nome del file di backup (APP_NAME_YYYY-MM-DD.sql)
  const currentDate = new Date()
  const formattedDate = currentDate.toISOString().slice(0, 10) // YYYY-MM-DD
  const fileName = `${appName}_${formattedDate}.sql` // Usa APP_NAME per il nome del file

  // Usa la cartella temporanea /tmp per il backup su Heroku
  const filePath = path.join("/tmp", fileName) // Usando /tmp su Heroku

  // Comando per pg_dump, con gestione delle virgolette per il nome del file
  const dumpCommand = `PGPASSWORD=${dbPassword} pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} > "${filePath}"`

  // Esegui il comando pg_dump
  exec(dumpCommand, (error: Error | null) => {
    if (error) {
      console.error("Error during backup:", error.message)
      res
        .status(500)
        .json({ message: "Errore durante il backup del database." })
      return
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
    res.download(filePath, fileName, (err: Error) => {
      if (err) {
        console.error("Error sending file:", err.message)
        res.status(500).json({ message: "Errore durante l'invio del file." })
      } else {
        fs.unlinkSync(filePath)
      }
    })
  })
}

// Handler per importare un backup nel database
const handleImportBackup = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Validazione dell'utente prima di procedere
  const userId = await validateRequest(req, res)
  if (!userId) return // Se l'utente non è valido, interrompi l'esecuzione

  const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL // URL del database

  if (!databaseUrl) {
    res.status(500).json({ message: "Database URL is missing" })
    return
  }

  const { file } = req.body // Assumi che il file venga passato nel body della richiesta

  if (!file) {
    res.status(400).json({ message: "Backup file is missing" })
    return
  }

  // Estrai i dettagli della connessione dalla stringa di connessione
  let dbUser, dbPassword, dbHost, dbPort, dbName
  try {
    ;({
      user: dbUser,
      password: dbPassword,
      host: dbHost,
      port: dbPort,
      dbname: dbName,
    } = parseDatabaseUrl(databaseUrl))
  } catch (err) {
    res.status(500).json({ message: "Error parsing DATABASE_URL." })
    return
  }

  // Comando per importare il file di backup nel database
  const importCommand = `PGPASSWORD=${dbPassword} psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} < "${file}"`

  // Esegui il comando di importazione
  exec(importCommand, (error: Error | null) => {
    if (error) {
      console.error("Error during import:", error.message)
      res
        .status(500)
        .json({ message: "Errore durante l'importazione del database." })
      return
    }

    res.status(200).json({ message: "Importazione completata con successo." })
  })
}

// Definisci le rotte
backupRouter.get("/", handleDownloadBackup)
backupRouter.post("/import", handleImportBackup)

export default backupRouter
