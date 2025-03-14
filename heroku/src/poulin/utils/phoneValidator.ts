export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Rimuovi spazi e caratteri non necessari
  const cleanNumber = phoneNumber.replace(/\s+/g, "")

  // Regex per i formati dei numeri di telefono
  const patterns = {
    // Italia: +39 seguito da 9-10 cifre
    italy: /^(\+39)?[0-9]{9,10}$/,

    // Spagna: +34 seguito da 9 cifre
    spain: /^(\+34)?[0-9]{9}$/,

    // Portogallo: +351 seguito da 9 cifre
    portugal: /^(\+351)?[0-9]{9}$/,
  }

  return (
    patterns.italy.test(cleanNumber) ||
    patterns.spain.test(cleanNumber) ||
    patterns.portugal.test(cleanNumber)
  )
}
