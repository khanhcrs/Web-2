import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './OrderManagement.css'
import { listOrders, updateOrderStatus } from '../../services/orderService'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Cho xu ly' },
  { value: 'processing', label: 'Dang xu ly' },
  { value: 'confirmed', label: 'Da xac nhan' },
  { value: 'shipped', label: 'Da gui hang' },
  { value: 'delivered', label: 'Da giao thanh cong' },
  { value: 'cancelled', label: 'Da huy' }
]

const statusLabel = (value) => {
  const match = STATUS_OPTIONS.find((option) => option.value === value)
  return match ? match.label : value
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0)

const OrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortByWard, setSortByWard] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await listOrders()
      setOrders(data)
    } catch (fetchError) {
      setError(fetchError.message || 'Khong the tai don hang.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders]

    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter)
    }

    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0)
      result = result.filter((order) => new Date(order.createdAt).getTime() >= start)
    }

    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999)
      result = result.filter((order) => new Date(order.createdAt).getTime() <= end)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      result = result.filter((order) =>
        String(order.orderId).toLowerCase().includes(normalizedSearch) ||
        (order.customer?.name || '').toLowerCase().includes(normalizedSearch) ||
        (order.customer?.email || '').toLowerCase().includes(normalizedSearch)
      )
    }

    if (sortByWard) {
      result.sort((left, right) => {
        const addressA = (left.address || left.delivery_address || '').toLowerCase()
        const addressB = (right.address || right.delivery_address || '').toLowerCase()
        return addressA.localeCompare(addressB)
      })
    } else {
      result.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    }

    return result
  }, [endDate, orders, searchTerm, sortByWard, startDate, statusFilter])

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId)
    setError('')
    setFeedback('')

    try {
      const data = await updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((order) => (order.orderId === orderId ? data.order : order)))
      setSelectedOrder((prev) => (prev?.orderId === orderId ? data.order : prev))
      setFeedback('Da cap nhat trang thai don hang.')
    } catch (updateError) {
      setError(updateError.message || 'Khong the cap nhat trang thai don hang.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='order-management'>
      <section className='order-management-card'>
        <div className='order-management-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Quan ly don hang</h1>
            <p>Theo doi, loc theo thoi gian va sap xep dia chi giao hang.</p>
          </div>
          <button type='button' onClick={fetchOrders} disabled={loading} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none' }}>
            {loading ? 'Dang tai...' : 'Lam moi du lieu'}
          </button>
        </div>

        <div className='order-management-filters' style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <div className='filter-group' style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Tim kiem</label>
            <input type='text' placeholder='Ten khach, email, ma don...' value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div className='filter-group'>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Trang thai</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value='all'>Tat ca trang thai</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className='filter-group'>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Tu ngay</label>
            <input type='date' value={startDate} onChange={(event) => setStartDate(event.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div className='filter-group'>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Den ngay</label>
            <input type='date' value={endDate} onChange={(event) => setEndDate(event.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div className='filter-group' style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => setSortByWard(!sortByWard)}
              style={{ padding: '9px 15px', background: sortByWard ? '#10b981' : '#e2e8f0', color: sortByWard ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {sortByWard ? 'Dang xep theo Phuong/Xa' : 'Sap xep theo Phuong/Xa'}
            </button>
          </div>
        </div>

        {error && <div style={{ marginBottom: '15px', color: '#dc2626', fontWeight: 'bold' }}>{error}</div>}
        {feedback && <div style={{ marginBottom: '15px', color: '#16a34a', fontWeight: 'bold' }}>{feedback}</div>}

        <div className='order-management-result-count' style={{ marginBottom: '15px' }}>
          <span>Ket qua tim thay: </span><strong style={{ color: '#3b82f6', fontSize: '18px' }}>{filteredAndSortedOrders.length}</strong> don hang
        </div>

        <div className='order-management-list'>
          {filteredAndSortedOrders.map((order) => (
            <article key={order.orderId} className='order-card' style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '15px', background: 'white' }}>
              <div className='order-card-header' style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0f172a' }}>Ma don: #{order.orderId}</h2>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Ngay dat: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={order.status}
                    onChange={(event) => handleStatusChange(order.orderId, event.target.value)}
                    disabled={updatingId === order.orderId}
                    style={{ padding: '6px', borderRadius: '4px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1' }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button onClick={() => setSelectedOrder(order)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Xem chi tiet
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <div>
                  <strong>Khach hang: </strong> {order.customer?.name || 'Khach vang lai'}<br />
                  <strong>Dia chi: </strong> <span style={{ color: sortByWard ? '#10b981' : 'inherit', fontWeight: sortByWard ? 'bold' : 'normal' }}>{order.address || order.delivery_address || 'Chua cap nhat dia chi'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Tong thanh toan: </strong><br />
                  <span style={{ fontSize: '18px', color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedOrder && (
        <div className='order-detail-modal-overlay' style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className='order-detail-modal' style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2>Chi tiet don hang #{selectedOrder.orderId}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: '#ef4444', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>x</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Thong tin nguoi nhan</h4>
                <p><strong>Ten:</strong> {selectedOrder.customer?.name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                <p><strong>Dien thoai:</strong> {selectedOrder.phone || 'Chua cap nhat'}</p>
                <p><strong>Dia chi:</strong> {selectedOrder.address || selectedOrder.delivery_address}</p>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Trang thai don</h4>
                <p style={{ fontWeight: 'bold', color: '#3b82f6' }}>{statusLabel(selectedOrder.status)}</p>
                <p><strong>Ngay dat:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            <h4 style={{ margin: '0 0 10px 0' }}>San pham da dat</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Ten SP</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Size</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>SL</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Don gia</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, index) => (
                  <tr key={`${item.productId || item.name}-${index}`}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{item.name}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{item.size || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '18px' }}>
              Tong cong: <strong style={{ color: '#ef4444' }}>{formatCurrency(selectedOrder.total)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
