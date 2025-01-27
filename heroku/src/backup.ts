import { exec } from "child_process"
import { Request, Response, Router } from "express"
import fs from "fs"
import path from "path"

// Ottieni la directory corrente utilizzando import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname)

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

// Handler per il backup del database
backupRouter.get("/", async (req: Request, res: Response): Promise<void> => {
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

  // Comando per pg_dump
  const dumpCommand = `PGPASSWORD=${dbPassword} pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} > ${filePath}`

  // Esegui il comando pg_dump
  exec(dumpCommand, (error: Error | null) => {
    if (error) {
      console.error("Error during backup:", error.message)
      res
        .status(500)
        .json({ message: "Errore durante il backup del database." })
      return
    }

    // Invia il file al client
    res.download(filePath, fileName, (err: Error) => {
      if (err) {
        console.error("Error sending file:", err.message)
        res.status(500).json({ message: "Errore durante l'invio del file." })
        return
      }

      // Elimina il file dal server (dopo che è stato scaricato)
      fs.unlinkSync(filePath) // Elimina il file dopo il download
    })
  })
})

export default backupRouter
