import { RequestHandler, Router } from "express"

import { pool } from "../../server.js"
import { validateRequest } from "./validateUser.js"

const modelsRouter = Router()

// Funzione per creare un nuovo modello
const createModel: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  const { model } = req.body
  if (!model) {
    res.status(400).json({ error: "Il campo 'model' non può essere nullo." })
    return
  }
  try {
    const result = await pool.query(
      "INSERT INTO Models (model) VALUES ($1) RETURNING *",
      [model]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error creating model:", error)
    res.status(500).json({ error: "Errore durante la creazione del modello." })
  }
}

// Funzione per ottenere tutti i modelli
const getModels: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) {
    return // Se l'ID utente non è valido, termina l'esecuzione
  }

  try {
    const result = await pool.query("SELECT * FROM Models")
    res.status(200).json(result.rows)
  } catch (error) {
    console.error("Error fetching models:", error)
    res.status(500).json({ error: "Errore durante il recupero dei modelli." })
  }
}

// Funzione per aggiornare un modello esistente
const updateModel: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  const { id } = req.params
  const { model } = req.body
  if (!model) {
    res.status(400).json({ error: "Il campo 'model' non può essere nullo." })
    return
  }
  try {
    const result = await pool.query(
      "UPDATE Models SET model = $1 WHERE idmodel = $2 RETURNING *",
      [model, id]
    )
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Modello non trovato." })
      return
    }
    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error("Error updating model:", error)
    res
      .status(500)
      .json({ error: "Errore durante l'aggiornamento del modello." })
  }
}

// Funzione per eliminare un modello
const deleteModel: RequestHandler = async (req, res) => {
  const { userId, token } = await validateRequest(req, res)
  if (!userId) return

  const { name } = req.params
  try {
    const promptCheck = await pool.query(
      "SELECT COUNT(*) FROM prompts WHERE model = $1",
      [name]
    )
    if (parseInt(promptCheck.rows[0].count) > 0) {
      res.status(400).json({ error: "Cannot  delete" })
      return
    }

    const result = await pool.query("DELETE FROM Models WHERE model = $1", [
      name,
    ])
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Modello non trovato." })
      return
    }
    res.status(204).send()
  } catch (error) {
    console.error("Error deleting model:", error)
    res
      .status(500)
      .json({ error: "Errore durante l'eliminazione del modello." })
  }
}

// Definizione delle rotte
modelsRouter.post("/new", createModel)
modelsRouter.get("/", getModels)
modelsRouter.put("/update/:id", updateModel)
modelsRouter.delete("/delete/:name", deleteModel)

export default modelsRouter
