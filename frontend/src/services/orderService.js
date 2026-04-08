import { apiRequest } from './apiClient'

export const createOrder = (payload) =>
  apiRequest('/orders', {
    method: 'POST',
    data: payload,
    fallbackErrorMessage: 'Khong the tao don hang.'
  })

export const getMyOrders = async (token) => {
  const data = await apiRequest('/my-orders', {
    token,
    fallbackErrorMessage: 'Khong the tai lich su don hang.'
  })

  return Array.isArray(data) ? data : []
}

export const getOrderDetail = (orderId, token) =>
  apiRequest(`/order/${orderId}`, {
    token,
    fallbackErrorMessage: 'Khong the tai chi tiet don hang.'
  })
