import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}/auth/verify-otp`

export const verifyOtp = async (userData) => {
  try {
    await axios.post(API_URL, userData)
    return true
  } catch (error) {
    throw new Error("OTP verification failed")
  }
}
