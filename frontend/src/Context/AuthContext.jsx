import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

const TOKEN_STORAGE_KEY = 'auth_token'
const USER_STORAGE_KEY = 'auth_user'

export const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  updateUser: () => {},
  logout: () => {}
})

const normalizeUser = (candidateUser) => {
  if (!candidateUser || typeof candidateUser !== 'object') {
    return candidateUser
  }

  return {
    ...candidateUser,
    addressBook: Array.isArray(candidateUser.addressBook)
      ? candidateUser.addressBook
      : [],
  }
}

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(normalizeUser(parsedUser))
      }
    } catch (error) {
      console.error('Không thể tải thông tin đăng nhập từ bộ nhớ.', error)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }, [])

  const login = useCallback((nextToken, nextUser) => {
    const normalizedUser = normalizeUser(nextUser)
    setToken(nextToken)
    setUser(normalizedUser)
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
  }, [])

  const updateUser = useCallback((nextUser) => {
    const normalizedUser = normalizeUser(nextUser)
    setUser(normalizedUser)

    if (normalizedUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  const contextValue = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      updateUser,
      logout
    }),
    [login, logout, token, updateUser, user]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export default AuthProvider
