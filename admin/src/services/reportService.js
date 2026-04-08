import { adminRequest } from './apiClient'

export const getStockAtTimeReport = (params) => {
  const query = new URLSearchParams(params)
  return adminRequest(`/reports/stock-at-time?${query.toString()}`, {
    fallbackErrorMessage: 'Khong the tai bao cao ton kho.'
  })
}

export const getImportExportReport = (params) => {
  const query = new URLSearchParams(params)
  return adminRequest(`/reports/import-export?${query.toString()}`, {
    fallbackErrorMessage: 'Khong the tai bao cao nhap xuat.'
  })
}

export const getLowStockReport = (params) => {
  const query = new URLSearchParams(params)
  return adminRequest(`/reports/low-stock?${query.toString()}`, {
    fallbackErrorMessage: 'Khong the tai canh bao ton kho.'
  })
}
