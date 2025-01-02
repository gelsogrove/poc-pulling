export interface User {
  userId: string
  username: string
  expire: Date
  role: string | null
}

export default User
