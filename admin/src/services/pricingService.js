import { adminRequest } from './apiClient'

export const updateProfitMargin = (payload) =>
  adminRequest('/update-profit-margin', {
    method: 'PUT',
    data: payload,
    fallbackErrorMessage: 'Khong the cap nhat ty le loi nhuan.'
  })
