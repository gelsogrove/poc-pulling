/* eslint-disable no-undef */
import axios from "axios"
import Cookies from "js-cookie"

const API_URL = `${process.env.REACT_APP_API_URL}/poulin/sales-reader/users`

/**
 * Fetch all users
 * @returns {Promise<Array>} List of users
 */
export const fetchUsers = async () => {
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    const response = await axios.get(`${API_URL}`, { headers })
    return response.data
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

/**
 * Delete a user by ID
 * @param {number} userId - ID of the user to delete
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    await axios.delete(`${API_URL}/delete/${userId}`, { headers })
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

/**
 * Update a user by ID
 * @param {number} userId - ID of the user to update
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = async (userId, userData) => {
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await axios.put(`${API_URL}/update/${userId}`, userData, {
      headers,
    })
    return response.data
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

/**
 * Create a new user
 * @param {Object} userData - New user data
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (userData) => {
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    const response = await axios.post(`${API_URL}`, userData, { headers })
    return response.data
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

/**
 * Toggle user's isActive status
 * @param {number} userId - ID of the user to toggle
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} Updated user object
 */
export const toggleUserActive = async (userId, isactive) => {
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    const response = await axios.get(
      `${API_URL}/isactive/${userId}/`,
      { isactive },
      { headers }
    )
    return response.data
  } catch (error) {
    console.error("Error toggling user active status:", error)
    throw error
  }
}

/**
 * Change a user's password
 * @param {string} newPassword - The new password to set
 * @returns {Promise<Object>} Response from the server
 */
export const changePassword = async (newPassword, userid) => {
  const token = Cookies.get("token")
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
    const response = await axios.put(
      `${API_URL}/change-password`,
      { newPassword, userid },
      { headers }
    )
    return response.data
  } catch (error) {
    console.error("Error changing password:", error)
    throw error
  }
}
