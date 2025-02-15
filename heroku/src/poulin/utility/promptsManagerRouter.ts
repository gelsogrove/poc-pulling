import { Request, RequestHandler, Response, Router } from "express"
import fs from "fs"
import multer from "multer"
import path from "path"
import { pool } from "../../../server.js"
import { validateRequest } from "../share/validateUser.js"

// Crea la directory se non esiste
const uploadDir = "public/images/chatbots"
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

interface MulterRequest extends Request {
  file?: Express.Multer.File | undefined
}

const promptsManagerRouter = Router()

const storage = multer.diskStorage({
  destination: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    // Assicurati che la directory esista
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, `chatbot-${Date.now()}${path.extname(file.originalname)}`)
  },
})

const upload = multer({ storage })

// Funzione per creare un nuovo prompt
const createPrompt: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { promptname, model, temperature, prompt, path } = req.body
  if (!promptname || !model || !prompt || !path) {
    res.status(400).json({ error: "Required fields cannot be null" })
    return
  }

  try {
    const result = await pool.query(
      `INSERT INTO prompts (promptname, model, temperature, prompt, path, isactive) 
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING *`,
      [promptname, model, temperature, prompt, path]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating prompt:", error)
    res.status(500).json({ error: "Error during prompt creation" })
  }
}

// Funzione per ottenere tutti i prompts
const getPrompts: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = await validateRequest(req, res)
    if (!validation) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }

    const { userId } = validation

    // Verifica se l'utente è admin
    const userCheck = await pool.query(
      "SELECT role FROM users WHERE userid = $1",
      [userId]
    )

    const isAdmin = userCheck.rows[0]?.role.toLowerCase() === "admin"

    // Se admin vede tutti i prompts, altrimenti solo quelli attivi
    const query = isAdmin
      ? 'SELECT * FROM prompts ORDER BY "order" ASC'
      : 'SELECT * FROM prompts WHERE isactive = true AND ishide = false ORDER BY "order" ASC'

    const result = await pool.query(query)
    res.status(200).json(result.rows)
    return
  } catch (error) {
    console.error("Error fetching prompts:", error)
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

// Funzione per aggiornare un prompt esistente
const updatePrompt: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = await validateRequest(req, res)
    if (!validation) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }

    const { userId } = validation
    const { id } = req.params
    const { promptname, model, temperature, prompt, path } = req.body

    if (!promptname || !model || !prompt || !path) {
      res.status(400).json({ error: "Required fields cannot be null" })
      return
    }

    // Aggiungiamo un controllo più sicuro per il file
    const multerReq = req as MulterRequest
    const imagePath =
      multerReq.file && multerReq.file.filename
        ? `/images/chatbots/${multerReq.file.filename}`
        : req.body.image || "/images/chatbot.webp"

    const result = await pool.query(
      `UPDATE prompts 
       SET promptname = $1, model = $2, temperature = $3, prompt = $4, path = $5, image = $6 
       WHERE idprompt = $7 
       RETURNING *`,
      [promptname, model, temperature, prompt, path, imagePath, id]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Error updating prompt:", error)
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

// Funzione per eliminare un prompt
const deletePrompt: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { idprompt } = req.params
  try {
    // Verifica se il prompt è in uso nella tabella usage
    const usageCheck = await pool.query(
      `
      SELECT COUNT(*)
      FROM usage
      WHERE idprompt = $1
    `,
      [idprompt]
    )

    if (parseInt(usageCheck.rows[0].count) > 0) {
      res
        .status(400)
        .json({ error: "Cannot delete prompt because it is in use" })
      return
    }

    const result = await pool.query("DELETE FROM prompts WHERE idprompt = $1", [
      idprompt,
    ])

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting prompt:", error)
    res.status(500).json({ error: "Error while deleting prompt" })
  }
}

// Aggiungiamo la funzione per il toggle
const togglePromptActive: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { idprompt } = req.params
  try {
    const result = await pool.query(
      "UPDATE prompts SET isactive = NOT isactive WHERE idprompt = $1 RETURNING *",
      [idprompt]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Error toggling prompt active state:", error)
    res.status(500).json({ error: "Error updating prompt state" })
  }
}

// Aggiungiamo una nuova funzione per il toggle hide
const togglePromptHide: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica se l'utente è admin
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { idprompt } = req.params
  try {
    const result = await pool.query(
      "UPDATE prompts SET ishide = NOT ishide WHERE idprompt = $1 RETURNING *",
      [idprompt]
    )

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Error toggling prompt hide state:", error)
    res.status(500).json({ error: "Error updating prompt hide state" })
  }
}

// Aggiungiamo funzioni per gestire l'ordine
const movePromptOrder: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  // Verifica admin...
  const userCheck = await pool.query(
    "SELECT role FROM users WHERE userid = $1",
    [userId]
  )

  if (userCheck.rows[0]?.role.toLowerCase() !== "admin") {
    res.status(403).json({ error: "Only admin users can manage prompts" })
    return
  }

  const { idprompt, direction } = req.params
  try {
    // Ottieni l'ordine corrente
    const currentPrompt = await pool.query(
      'SELECT "order" FROM prompts WHERE idprompt = $1',
      [idprompt]
    )

    if (currentPrompt.rowCount === 0) {
      res.status(404).json({ error: "Prompt not found" })
      return
    }

    const currentOrder = currentPrompt.rows[0].order

    // Trova il prompt con cui scambiare l'ordine
    const swapPrompt = await pool.query(
      direction === "up"
        ? 'SELECT idprompt, "order" FROM prompts WHERE "order" < $1 ORDER BY "order" DESC LIMIT 1'
        : 'SELECT idprompt, "order" FROM prompts WHERE "order" > $1 ORDER BY "order" ASC LIMIT 1',
      [currentOrder]
    )

    if (swapPrompt.rowCount === 0) {
      res.status(400).json({ error: "Cannot move prompt further" })
      return
    }

    // Scambia gli ordini
    await pool.query(
      'UPDATE prompts SET "order" = CASE ' +
        "WHEN idprompt = $1 THEN $2 " +
        "WHEN idprompt = $3 THEN $4 " +
        "END " +
        "WHERE idprompt IN ($1, $3)",
      [
        idprompt,
        swapPrompt.rows[0].order,
        swapPrompt.rows[0].idprompt,
        currentOrder,
      ]
    )

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error moving prompt order:", error)
    res.status(500).json({ error: "Error updating prompt order" })
  }
}

// Definizione delle rotte
promptsManagerRouter.post("/new", createPrompt)
promptsManagerRouter.get("/", getPrompts)
promptsManagerRouter.put("/update/:id", upload.single("image"), updatePrompt)
promptsManagerRouter.delete("/delete/:idprompt", deletePrompt)
promptsManagerRouter.put("/toggle/:idprompt", togglePromptActive)
promptsManagerRouter.put("/toggle-hide/:idprompt", togglePromptHide)
promptsManagerRouter.put("/move-order/:idprompt/:direction", movePromptOrder)

export default promptsManagerRouter
