import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('mira_token'))
  const [loading, setLoading] = useState(true)

  // Set axios header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('mira_token', token)
      // Fetch user info
      axios.get(`${API_BASE}/auth/me`)
        .then(res => setUser(res.data))
        .catch(() => {
          // Token invalid — clear it
          setToken(null)
          localStorage.removeItem('mira_token')
        })
        .finally(() => setLoading(false))
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('mira_token')
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const register = async (email, password, name) => {
    const { data } = await axios.post(`${API_BASE}/auth/register`, {
      email, password, name
    })
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const login = async (email, password) => {
    // OAuth2PasswordRequestForm requires form-data
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    const { data } = await axios.post(
      `${API_BASE}/auth/login`,
      formData,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}