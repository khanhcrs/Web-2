import { adminRequest } from './apiClient'

export const loginAdmin = (payload) =>
  adminRequest('/login', {
    method: 'POST',
    data: payload,
    fallbackErrorMessage: 'Dang nhap that bai.'
  })
