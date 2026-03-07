import React, { useCallback, useEffect, useState, useMemo } from 'react'
import './OrderManagement.css'
import { API_BASE_URL } from '../../config'

// 1. CẬP NHẬT TRẠNG THÁI ĐÚNG YÊU CẦU ĐỀ BÀI
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'delivered', label: 'Đã giao thành công' },
  { value: 'cancelled', label: 'Đã huỷ' }
]

const statusLabel = (value) => {
  const match = STATUS_OPTIONS.find((option) => option.value === value)
  return match ? match.label : value
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0)
}

const OrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // STATE CHO BỘ LỌC VÀ SẮP XẾP
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortByWard, setSortByWard] = useState(false) // Toggle sắp xếp theo Phường

  // STATE CHO MODAL XEM CHI TIẾT
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/orders`)
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể tải đơn hàng.')
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (err) {
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // ================== LOGIC LỌC VÀ SẮP XẾP ==================
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Lọc theo trạng thái
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // 2. Lọc theo ngày tháng
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      result = result.filter(order => new Date(order.createdAt).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      result = result.filter(order => new Date(order.createdAt).getTime() <= end);
    }

    // 3. Lọc theo từ khóa (Tìm kiếm)
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      result = result.filter(order => {
        return (
          String(order.orderId).toLowerCase().includes(normalizedSearch) ||
          (order.customer?.name || '').toLowerCase().includes(normalizedSearch) ||
          (order.customer?.email || '').toLowerCase().includes(normalizedSearch)
        );
      });
    }

    // 4. Sắp xếp theo Phường/Xã (Địa chỉ)
    if (sortByWard) {
      result.sort((a, b) => {
        const addressA = (a.address || a.delivery_address || '').toLowerCase();
        const addressB = (b.address || b.delivery_address || '').toLowerCase();
        // Giả sử lấy ra chữ "phường..." để sort, ở đây sort theo toàn chuỗi địa chỉ (sẽ gom các phường giống nhau lại)
        return addressA.localeCompare(addressB);
      });
    } else {
      // Mặc định sắp xếp đơn mới nhất lên đầu
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [orders, statusFilter, startDate, endDate, searchTerm, sortByWard]);

  // ================== CẬP NHẬT TRẠNG THÁI ==================
  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId)
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await response.json()
      if (data.success) {
        setOrders(prev => prev.map(order => order.orderId === orderId ? data.order : order))
      } else {
        alert("Lỗi: " + data.message)
      }
    } catch (err) {
      alert("Không thể kết nối máy chủ!")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='order-management'>
      <section className='order-management-card'>
        <div className='order-management-header' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Quản lý đơn hàng</h1>
            <p>Theo dõi, lọc theo thời gian và sắp xếp địa chỉ giao hàng.</p>
          </div>
          <button type='button' onClick={fetchOrders} disabled={loading} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none' }}>
            {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
        </div>

        {/* ================== THANH CÔNG CỤ LỌC ================== */}
        <div className='order-management-filters' style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <div className='filter-group' style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Tìm kiếm</label>
            <input type='text' placeholder='Tên khách, email, mã đơn...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div className='filter-group'>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Trạng thái</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value='all'>Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          <div className='filter-group'>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Từ ngày</label>
            <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div className='filter-group'>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Đến ngày</label>
            <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div className='filter-group' style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => setSortByWard(!sortByWard)}
              style={{ padding: '9px 15px', background: sortByWard ? '#10b981' : '#e2e8f0', color: sortByWard ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {sortByWard ? '🔄 Đang xếp theo Phường/Xã' : '🔃 Sắp xếp theo Phường/Xã'}
            </button>
          </div>
        </div>

        <div className='order-management-result-count' style={{ marginBottom: '15px' }}>
          <span>Kết quả tìm thấy: </span><strong style={{ color: '#3b82f6', fontSize: '18px' }}>{filteredAndSortedOrders.length}</strong> đơn hàng
        </div>

        {/* ================== DANH SÁCH ĐƠN HÀNG ================== */}
        <div className='order-management-list'>
          {filteredAndSortedOrders.map((order) => (
            <article key={order.orderId} className='order-card' style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginBottom: '15px', background: 'white' }}>
              <div className='order-card-header' style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#0f172a' }}>Mã Đơn: #{order.orderId}</h2>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                    disabled={updatingId === order.orderId}
                    style={{ padding: '6px', borderRadius: '4px', fontWeight: 'bold', background: '#f8fafc', border: '1px solid #cbd5e1' }}
                  >
                    {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                  <button onClick={() => setSelectedOrder(order)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    👁️ Xem chi tiết
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <div>
                  <strong>Khách hàng: </strong> {order.customer?.name || 'Khách vãng lai'}<br />
                  <strong>Địa chỉ: </strong> <span style={{ color: sortByWard ? '#10b981' : 'inherit', fontWeight: sortByWard ? 'bold' : 'normal' }}>{order.address || order.delivery_address || 'Chưa cập nhật địa chỉ'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Tổng thanh toán: </strong><br />
                  <span style={{ fontSize: '18px', color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ================== MODAL XEM CHI TIẾT ĐƠN HÀNG ================== */}
      {selectedOrder && (
        <div className="order-detail-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="order-detail-modal" style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2>Chi tiết đơn hàng #{selectedOrder.orderId}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: '#ef4444', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Thông tin người nhận</h4>
                <p><strong>Tên:</strong> {selectedOrder.customer?.name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                <p><strong>Điện thoại:</strong> {selectedOrder.phone || 'Chưa cập nhật'}</p>
                <p><strong>Địa chỉ:</strong> {selectedOrder.address || selectedOrder.delivery_address}</p>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Trạng thái đơn</h4>
                <p style={{ fontWeight: 'bold', color: '#3b82f6' }}>{statusLabel(selectedOrder.status)}</p>
                <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>

            <h4 style={{ margin: '0 0 10px 0' }}>Sản phẩm đã đặt</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Tên SP</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Size</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>SL</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{item.name}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{item.size || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>{formatCurrency(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '18px' }}>
              Tổng cộng: <strong style={{ color: '#ef4444' }}>{formatCurrency(selectedOrder.total)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement