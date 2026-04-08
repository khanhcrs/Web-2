import { apiRequest } from './apiClient'

export const listProducts = async () => {
  const data = await apiRequest('/allproducts', {
    fallbackErrorMessage: 'Khong the tai danh sach san pham.'
  })

  return Array.isArray(data) ? data : []
}
