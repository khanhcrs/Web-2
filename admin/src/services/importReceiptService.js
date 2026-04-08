import { adminRequest } from './apiClient'

export const listImportReceipts = async () => {
  const data = await adminRequest('/import-receipts', {
    fallbackErrorMessage: 'Khong the tai danh sach phieu nhap.'
  })

  return Array.isArray(data?.receipts) ? data.receipts : []
}

export const getImportReceipt = (receiptId) =>
  adminRequest(`/import-receipts/${receiptId}`, {
    fallbackErrorMessage: 'Khong the tai chi tiet phieu nhap.'
  })

export const createImportReceipt = (payload) =>
  adminRequest('/import-receipts', {
    method: 'POST',
    data: payload,
    fallbackErrorMessage: 'Khong the tao phieu nhap.'
  })

export const updateImportReceipt = (receiptId, payload) =>
  adminRequest(`/import-receipts/${receiptId}`, {
    method: 'PUT',
    data: payload,
    fallbackErrorMessage: 'Khong the cap nhat phieu nhap.'
  })

export const completeImportReceipt = (receiptId) =>
  adminRequest(`/import-receipts/${receiptId}/complete`, {
    method: 'POST',
    fallbackErrorMessage: 'Khong the hoan thanh phieu nhap.'
  })
