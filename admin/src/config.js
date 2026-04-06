const normalizeBaseUrl = (url) => {
  if (!url) {
    return ''
  }
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const getDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8000'
  }

  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:8000`
}

const DEFAULT_API_BASE_URL = getDefaultApiBaseUrl()

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url)

export const resolveImageUrl = (imagePath) => {
  if (!imagePath) {
    return ''
  }
  if (isAbsoluteUrl(imagePath)) {
    return imagePath
  }
  const normalizedPath = imagePath.startsWith('/')
    ? imagePath
    : `/${imagePath}`
  if (!API_BASE_URL) {
    return normalizedPath
  }
  return `${API_BASE_URL}${normalizedPath}`
}
