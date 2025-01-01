import axios from "axios"

export const verifyOtp = async (otpCode) => {
  try {
    const response = await axios.post("/auth/verify-otp", { otpCode })
    return response.data // Assicurati di gestire la risposta come necessario
  } catch (error) {
    throw new Error("OTP verification failed")
  }
}
