import { API_BASE_URL } from '../config'

const buildUrl = (path) => {
  if (!path) {
    return API_BASE_URL
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

const buildHeaders = ({ headers = {}, token, authMode = 'bearer', body }) => {
  const nextHeaders = {
    Accept: 'application/json',
    ...headers
  }

  if (!(body instanceof FormData) && !nextHeaders['Content-Type']) {
    nextHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    if (authMode === 'legacy-token') {
      nextHeaders['auth-token'] = token
    } else {
      nextHeaders.Authorization = `Bearer ${token}`
    }
  }

  return nextHeaders
}

const parseResponse = async (response) => {
  const rawText = await response.text()

  if (!rawText) {
    return null
  }

  try {
    return JSON.parse(rawText)
  } catch (error) {
    return rawText
  }
}

const resolveErrorMessage = (payload, fallbackMessage) => {
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim() !== '') {
      return payload.message
    }

    if (typeof payload.error === 'string' && payload.error.trim() !== '') {
      return payload.error
    }
  }

  if (typeof payload === 'string' && payload.trim() !== '') {
    return payload
  }

  return fallbackMessage
}

export const apiRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    data,
    token,
    authMode = 'bearer',
    headers = {},
    fallbackErrorMessage = 'Request failed.'
  } = options

  const body = data instanceof FormData
    ? data
    : data !== undefined
      ? JSON.stringify(data)
      : undefined

  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders({ headers, token, authMode, body }),
    body
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(resolveErrorMessage(payload, fallbackErrorMessage))
  }

  return payload
}
