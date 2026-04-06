export const ADMIN_TOKEN_STORAGE_KEY = 'clothify_admin_token'
export const ADMIN_USER_STORAGE_KEY = 'clothify_admin_user'

export const getAdminSession = () => {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
    const rawUser = localStorage.getItem(ADMIN_USER_STORAGE_KEY)
    const user = rawUser ? JSON.parse(rawUser) : null

    if (!token || !user) {
      return { token: null, user: null }
    }

    return { token, user }
  } catch (error) {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
    return { token: null, user: null }
  }
}

export const saveAdminSession = (token, user) => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
  localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(user))
}

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
}

export const isAdminSessionValid = () => {
  const { token, user } = getAdminSession()
  return Boolean(token && user && user.role === 'admin')
}

export const getAdminAuthHeaders = (headers = {}) => {
  const { token } = getAdminSession()
  if (!token) {
    return headers
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`
  }
}
