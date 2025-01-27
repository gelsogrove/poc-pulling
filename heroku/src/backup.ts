import archiver from "archiver"
import { exec } from "child_process"
import { Request, Response, Router } from "express"
import fileUpload, { UploadedFile } from "express-fileupload"
import fs from "fs"
import path from "path"
import { validateRequest } from "./validateUser"

const backupRouter = Router()

// Configura express-fileupload
backupRouter.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Limite 50MB
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
)

const parseDatabaseUrl = (
  url: string
): {
  user: string
  password: string
  host: string
  port: string
  dbname: string
} => {
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

// Esporta il database in formato ZIP
const handleExport = async (req: Request, res: Response): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL
  if (!databaseUrl) {
    res.status(500).json({ message: "Database URL is missing" })
    return
  }

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

  const currentDate = new Date().toISOString().slice(0, 10)
  const fileName = `backup_${currentDate}.sql`
  const sqlFilePath = path.join("/tmp", fileName)
  const zipFilePath = path.join("/tmp", `backup_${currentDate}.zip`)

  const dumpCommand = `PGPASSWORD=${dbPassword} pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} > "${sqlFilePath}"`

  exec(dumpCommand, (error) => {
    if (error) {
      console.error("Error during backup:", error.message)
      res.status(500).json({ message: "Error during database backup." })
      return
    }

    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver("zip")

    output.on("close", () => {
      console.log("EXPORT DONE")
      res.download(zipFilePath, `backup_${currentDate}.zip`, (err) => {
        if (err) {
          console.error("Error sending file:", err.message)
          res.status(500).json({ message: "Error sending the ZIP file." })
        }

        fs.unlinkSync(sqlFilePath)
        fs.unlinkSync(zipFilePath)
      })
    })

    archive.on("error", (err) => {
      console.error("Error creating ZIP archive:", err.message)
      res.status(500).json({ message: "Error creating ZIP archive." })
    })

    archive.pipe(output)
    archive.file(sqlFilePath, { name: fileName })
    archive.finalize()
  })
}

// Importa il backup
const handleImport = async (req: Request, res: Response): Promise<void> => {
  const userId = await validateRequest(req, res)
  if (!userId) return

  const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL
  if (!databaseUrl) {
    res.status(500).json({ message: "Database URL is missing" })
    return
  }

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

  if (!req.files || !req.files.file) {
    res.status(400).json({ message: "No file uploaded." })
    return
  }

  const file = req.files.file as UploadedFile
  const uploadPath = path.join("/tmp", file.name)

  file.mv(uploadPath, (err: Error) => {
    if (err) {
      console.error("Error saving uploaded file:", err.message)
      res.status(500).json({ message: "Error saving uploaded file." })
      return
    }

    const importCommand = `PGPASSWORD=${dbPassword} psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} < "${uploadPath}"`

    exec(importCommand, (error) => {
      fs.unlinkSync(uploadPath)
      if (error) {
        console.error("Error during import:", error.message)
        res.status(500).json({ message: "Error during database import." })
        return
      }

      console.log("IMPORT DONE")
      res.status(200).json({ message: "Import completed successfully." })
    })
  })
}

backupRouter.get("/", handleExport)
backupRouter.post("/import", handleImport)

export default backupRouter
