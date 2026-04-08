import { adminRequest } from './apiClient'

export const listProducts = async () => {
  const data = await adminRequest('/allproducts', {
    fallbackErrorMessage: 'Khong the tai danh sach san pham.'
  })

  return Array.isArray(data) ? data : []
}

export const uploadProductImage = (file) => {
  const formData = new FormData()
  formData.append('product', file)

  return adminRequest('/upload', {
    method: 'POST',
    data: formData,
    headers: {},
    fallbackErrorMessage: 'Khong the upload hinh anh.'
  })
}

export const addProduct = (payload) =>
  adminRequest('/addproduct', {
    method: 'POST',
    data: payload,
    fallbackErrorMessage: 'Khong the them san pham.'
  })

export const updateProduct = (productId, payload) =>
  adminRequest(`/product/${productId}`, {
    method: 'PUT',
    data: payload,
    fallbackErrorMessage: 'Khong the cap nhat san pham.'
  })

export const removeProduct = (productId) =>
  adminRequest('/removeproduct', {
    method: 'POST',
    data: { id: productId },
    fallbackErrorMessage: 'Khong the xoa san pham.'
  })
