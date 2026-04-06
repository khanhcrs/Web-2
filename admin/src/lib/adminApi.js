import { getAdminAuthHeaders } from './adminAuth'

export const adminFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: getAdminAuthHeaders(options.headers || {})
  })
}
