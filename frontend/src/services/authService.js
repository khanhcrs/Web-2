import { apiRequest } from './apiClient'

export const registerUser = (payload) =>
  apiRequest('/register', {
    method: 'POST',
    data: payload,
    fallbackErrorMessage: 'Khong the dang ky tai khoan.'
  })

export const loginUser = (payload) =>
  apiRequest('/login', {
    method: 'POST',
    data: payload,
    fallbackErrorMessage: 'Khong the dang nhap.'
  })
