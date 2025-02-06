import archiver from "archiver"
import { exec } from "child_process"
import { Request, Response, Router } from "express"
import fileUpload, { UploadedFile } from "express-fileupload"
import fs from "fs"
import path from "path"
import unzipper from "unzipper"
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
  const dumpCommand = `PGPASSWORD=${dbConfig.password} pg_dump -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.dbname} --column-inserts --data-only > "${sqlFilePath}" 2> "${sqlFilePath}_error.log"`

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

    console.log(`📂 File uploaded successfully to ${uploadPath}. Extracting...`)

    // Estrai il file SQL dal file ZIP
    fs.createReadStream(uploadPath)
      .pipe(unzipper.Extract({ path: "/tmp" }))
      .on("close", () => {
        console.log("📦 Extraction complete. Checking for SQL files...")

        // Controlla i file nella directory /tmp
        fs.readdir("/tmp", (err, files) => {
          if (err) {
            console.error("❌ Error reading /tmp directory:", err.message)
            res.status(500).json({ message: "Error reading /tmp directory." })
            return
          }

          console.log("📂 Files in /tmp directory:", files)
          const sqlFile = files.find((file) => file.endsWith(".sql"))
          if (!sqlFile) {
            console.error("❌ No SQL file found in /tmp directory.")
            res.status(500).json({ message: "No SQL file found." })
            return
          }

          const sqlFilePath = path.join("/tmp", sqlFile)
          console.log(`📂 Found SQL file: ${sqlFilePath}`)

          // Prepare the import command
          const importCommand = `PGPASSWORD=${dbConfig.password} psql -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.dbname} -c "\\i '${sqlFilePath}'"`
          console.log("🔄 Running import command:", importCommand)

          // Execute the import command
          exec(importCommand, (error, stdout, stderr) => {
            if (error) {
              console.error("❌ Error during import:", error.message)
              console.error("🔴 STDERR:", stderr)
              res.status(500).json({
                message: "Error during database import.",
                error: stderr,
              })
              return
            }

            console.log("✅ Import completed successfully!")
            console.log("🟢 STDOUT:", stdout)

            // Non rimuovere i file temporanei
            // fs.unlinkSync(uploadPath); // Rimuovi il file ZIP solo dopo un'importazione riuscita
            // fs.unlinkSync(sqlFilePath); // Non rimuovere il file SQL

            res.status(200).json({ message: "Import completed successfully." })
          })
        })
      })
      .on("error", (err) => {
        console.error("❌ Error during extraction:", err.message)
        res.status(500).json({ message: "Error during extraction." })
      })
  })
}

backupRouter.get("/", handleExport)
backupRouter.post("/import", handleImport)

export default backupRouter
