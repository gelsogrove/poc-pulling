import axios from "axios"

const API_URL = "https://poulin-bd075425a92c.herokuapp.com/auth/verify-otp"
export const verifyOtp = async (userData) => {
  try {
    await axios.post(API_URL, userData)
    return true
  } catch (error) {
    throw new Error("OTP verification failed")
  }
}
