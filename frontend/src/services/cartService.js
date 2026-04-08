import { apiRequest } from './apiClient'

export const getServerCart = async (token) => {
  const data = await apiRequest('/cart', {
    token,
    fallbackErrorMessage: 'Khong the tai gio hang.'
  })

  return data?.cartItems && typeof data.cartItems === 'object'
    ? data.cartItems
    : {}
}

export const saveServerCart = async (token, cartItems) => {
  const data = await apiRequest('/cart', {
    method: 'PUT',
    token,
    data: { cartItems },
    fallbackErrorMessage: 'Khong the dong bo gio hang.'
  })

  return data?.cartItems && typeof data.cartItems === 'object'
    ? data.cartItems
    : {}
}
