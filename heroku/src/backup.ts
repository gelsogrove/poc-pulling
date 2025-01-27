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

  // Genera il nome del file di backup
  const fileName = `backup_${new Date().toISOString().slice(0, 10)}.sql`
  const filePath = path.join(__dirname, "backups", fileName) // Usa la directory relativa di backup

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

      fs.unlinkSync(filePath) // Elimina il file dopo il download
    })
  })
})

export default backupRouter
