import { Pool } from "pg"
import { v4 as uuidv4 } from "uuid"
import { validatePhoneNumber } from "../utils/phoneValidator"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

export interface User {
  userid: string
  phone_number: string
  name?: string
  surname?: string
  role: string
  isactive: boolean
}

export const getUserIdByPhoneNumber = async (
  phoneNumber: string
): Promise<string> => {
  if (!validatePhoneNumber(phoneNumber)) {
    throw new Error("Invalid phone number format")
  }

  try {
    // Prima cerca l'utente esistente
    const existingUser = await pool.query(
      "SELECT userid FROM users WHERE phone_number = $1",
      [phoneNumber]
    )

    if (existingUser.rows.length > 0) {
      return existingUser.rows[0].userid
    }

    // Se l'utente non esiste, creane uno nuovo
    const newUserId = uuidv4()
    await pool.query(
      "INSERT INTO users (userid, phone_number, role, isactive) VALUES ($1, $2, $3, $4)",
      [newUserId, phoneNumber, "user", true]
    )

    return newUserId
  } catch (error) {
    console.error("Error in getUserIdByPhoneNumber:", error)
    throw error
  }
}
