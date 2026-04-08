import { API_BASE_URL } from '../config'
import { adminFetch } from '../lib/adminApi'

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

export const adminRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    data,
    headers = {},
    fallbackErrorMessage = 'Request failed.'
  } = options

  const body = data instanceof FormData
    ? data
    : data !== undefined
      ? JSON.stringify(data)
      : undefined

  const requestHeaders = {
    Accept: 'application/json',
    ...headers
  }

  if (!(body instanceof FormData) && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const response = await adminFetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(resolveErrorMessage(payload, fallbackErrorMessage))
  }

  return payload
}
