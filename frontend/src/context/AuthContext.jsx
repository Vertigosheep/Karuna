import { createContext, useContext, useState, useCallback } from 'react'

/**
 * Decode the payload of a JWT without verifying the signature.
 * Returns null if the token is malformed.
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * Restore auth state from localStorage on page load.
 */
function loadInitialState() {
  const token = localStorage.getItem('token')
  if (!token) return { token: null, user: null }
  const decoded = decodeToken(token)
  // Treat expired tokens as logged out
  if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
    localStorage.removeItem('token')
    return { token: null, user: null }
  }
  const user = localStorage.getItem('user')
  return { token, user: user ? JSON.parse(user) : null }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(loadInitialState)

  /** Call after a successful login or register+auto-login */
  const login = useCallback((token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setAuth({ token, user: userData })
  }, [])

  /** Clear all auth state */
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth({ token: null, user: null })
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn: Boolean(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
