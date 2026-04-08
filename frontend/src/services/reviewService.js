import { apiRequest } from './apiClient'

export const getProductReviews = async (productId) => {
  const data = await apiRequest(`/reviews/${productId}`, {
    fallbackErrorMessage: 'Khong the tai danh gia san pham.'
  })

  return Array.isArray(data?.reviews) ? data.reviews : []
}

export const addProductReview = (payload, token) =>
  apiRequest('/addreview', {
    method: 'POST',
    token,
    authMode: 'legacy-token',
    data: payload,
    fallbackErrorMessage: 'Khong the gui danh gia.'
  })
