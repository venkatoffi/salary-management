import React from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorizedHandler, tokenStorage } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    if (!tokenStorage.get()) {
      setLoading(false)
      return () => setUnauthorizedHandler(() => {})
    }

    api.currentUser()
      .then((result) => setUser(result.user))
      .catch(() => clearSession())
      .finally(() => setLoading(false))
    return () => setUnauthorizedHandler(() => {})
  }, [clearSession])

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password)
    setUser(result.user)
    return result.user
  }, [])

  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.get()) await api.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(() => ({ user, loading, login, logout, clearSession, updateUser }), [
    user,
    loading,
    login,
    logout,
    clearSession,
    updateUser,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
