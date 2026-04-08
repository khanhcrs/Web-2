import { adminRequest } from './apiClient'

export const listUsers = async () => {
  const data = await adminRequest('/users', {
    fallbackErrorMessage: 'Khong the tai danh sach khach hang.'
  })

  return Array.isArray(data?.users) ? data.users : []
}

export const updateUserRole = (userId, role) =>
  adminRequest(`/users/${userId}/role`, {
    method: 'PATCH',
    data: { role },
    fallbackErrorMessage: 'Khong the cap nhat vai tro tai khoan.'
  })

export const updateUserStatus = (userId, status) =>
  adminRequest(`/users/${userId}/status`, {
    method: 'PATCH',
    data: { status },
    fallbackErrorMessage: 'Khong the cap nhat trang thai tai khoan.'
  })
