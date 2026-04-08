import { adminRequest } from './apiClient'

export const listOrders = async () => {
  const data = await adminRequest('/orders', {
    fallbackErrorMessage: 'Khong the tai danh sach don hang.'
  })

  return Array.isArray(data?.orders) ? data.orders : []
}

export const updateOrderStatus = (orderId, status) =>
  adminRequest(`/orders/${orderId}`, {
    method: 'PATCH',
    data: { status },
    fallbackErrorMessage: 'Khong the cap nhat trang thai don hang.'
  })
