import archiver from "archiver"
import { exec } from "child_process"
import { Request, Response, Router } from "express"
import fileUpload, { UploadedFile } from "express-fileupload"
import fs from "fs"
import path from "path"
import { validateRequest } from "./validateUser.js"

const backupRouter = Router()

backupRouter.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Limite di 50MB
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
)

interface DatabaseConfig {
  user: string
  password: string
  host: string
  port: string
  dbname: string
}

const parseDatabaseUrl = (url: string): DatabaseConfig => {
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

/* ✅ Funzione per esportare il database */
const handleExport = async (req: Request, res: Response): Promise<void> => {
  console.log("📢 Starting database export...")
  const userId = await validateRequest(req, res)
  if (!userId) return

  const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL
  const appName = process.env.APP_NAME || "app"
  if (!databaseUrl) {
    console.error("❌ Database URL is missing")
    res.status(500).json({ message: "Database URL is missing" })
    return
  }

  let dbConfig: DatabaseConfig
  try {
    dbConfig = parseDatabaseUrl(databaseUrl)
    console.log("✅ Database configuration parsed successfully")
  } catch (err) {
    console.error("❌ Error parsing DATABASE_URL:", err)
    res.status(500).json({ message: "Error parsing DATABASE_URL." })
    return
  }

  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const fileName = `${appName}_${currentDate}.sql`
  const sqlFilePath = path.join("/tmp", fileName)
  const zipFilePath = path.join("/tmp", `${appName}_${currentDate}.zip`)

  // ✅ Export con INSERT INTO invece di COPY FROM stdin;
  const dumpCommand = `PGPASSWORD=${dbConfig.password} pg_dump -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.dbname} --column-inserts --data-only > "${sqlFilePath}"`

  console.log("🔄 Running dump command:", dumpCommand)

  exec(dumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error during backup:", error.message)
      console.error("🔴 STDERR:", stderr)
      res.status(500).json({ message: "Error during database backup." })
      return
    }
    console.log("✅ Backup completed successfully!")
    console.log("🟢 STDOUT:", stdout)

    const output = fs.createWriteStream(zipFilePath)
    const archive = archiver("zip")

    output.on("close", () => {
      console.log("📦 ZIP file created:", zipFilePath)

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${appName}_${currentDate}.zip"`
      )
      res.setHeader("Content-Type", "application/zip")
      res.download(zipFilePath, `${appName}_${currentDate}.zip`, (err) => {
        if (err) {
          console.error("❌ Error sending file:", err.message)
          res.status(500).json({ message: "Error sending the ZIP file." })
        } else {
          console.log("✅ File sent successfully!")
        }

        // Rimuove i file temporanei
        fs.unlinkSync(sqlFilePath)
        fs.unlinkSync(zipFilePath)
      })
    })

    archive.on("error", (err) => {
      console.error("❌ Error creating ZIP archive:", err.message)
      res.status(500).json({ message: "Error creating ZIP archive." })
    })

    archive.pipe(output)
    archive.file(sqlFilePath, { name: fileName })
    archive.finalize()
  })
}

/* ✅ Funzione per importare il database */
const handleImport = async (req: Request, res: Response): Promise<void> => {
  console.log("📢 Starting database import...")
  const userId = await validateRequest(req, res)
  if (!userId) return

  const databaseUrl = process.env.HEROKU_POSTGRESQL_AMBER_URL
  if (!databaseUrl) {
    console.error("❌ Database URL is missing")
    res.status(500).json({ message: "Database URL is missing" })
    return
  }

  let dbConfig: DatabaseConfig
  try {
    dbConfig = parseDatabaseUrl(databaseUrl)
    console.log("✅ Database configuration parsed successfully")
  } catch (err) {
    console.error("❌ Error parsing DATABASE_URL:", err)
    res.status(500).json({ message: "Error parsing DATABASE_URL." })
    return
  }

  if (!req.files || !req.files.file) {
    console.error("❌ No file uploaded")
    res.status(400).json({ message: "No file uploaded." })
    return
  }

  const file = req.files.file as UploadedFile
  const uploadPath = path.join("/tmp", file.name)
  console.log(`📂 Saving uploaded file to ${uploadPath}`)

  file.mv(uploadPath, (err: Error) => {
    if (err) {
      console.error("❌ Error saving uploaded file:", err.message)
      res.status(500).json({ message: "Error saving uploaded file." })
      return
    }

    // ✅ Import con \i per eseguire il file riga per riga
    const importCommand = `PGPASSWORD=${dbConfig.password} psql -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.dbname} -c "\\i '${uploadPath}'"`

    console.log("🔄 Running import command:", importCommand)

    exec(importCommand, (error, stdout, stderr) => {
      fs.unlinkSync(uploadPath)
      if (error) {
        console.error("❌ Error during import:", error.message)
        console.error("🔴 STDERR:", stderr)
        res.status(500).json({ message: "Error during database import." })
        return
      }

      console.log("✅ Import completed successfully!")
      console.log("🟢 STDOUT:", stdout)
      res.status(200).json({ message: "Import completed successfully." })
    })
  })
}

backupRouter.get("/", handleExport)
backupRouter.post("/import", handleImport)

export default backupRouter
