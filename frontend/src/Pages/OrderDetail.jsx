import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import './CSS/OrderDetail.css'
import { AuthContext } from '../Context/AuthContext'
import { resolveImageUrl } from '../config'
import { getOrderDetail } from '../services/orderService'

const formatCurrency = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')} VND`

const OrderDetail = () => {
  const { orderId } = useParams()
  const { token } = useContext(AuthContext)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const fetchOrderDetail = async () => {
      if (!token) {
        setError('Vui long dang nhap de xem chi tiet don hang.')
        setLoading(false)
        return
      }

      try {
        const data = await getOrderDetail(orderId, token)
        if (!ignore) {
          setOrder(data)
          setError('')
        }
      } catch (fetchError) {
        if (!ignore) {
          setOrder(null)
          setError(fetchError.message || 'Khong the tai chi tiet don hang.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchOrderDetail()

    return () => {
      ignore = true
    }
  }, [orderId, token])

  const shippingInfo = useMemo(() => {
    if (!order?.shipping_address) {
      return {}
    }

    if (typeof order.shipping_address === 'string') {
      try {
        return JSON.parse(order.shipping_address)
      } catch (error) {
        return {}
      }
    }

    return order.shipping_address
  }, [order])

  if (loading) {
    return <div className='order-detail'><h1>Chi tiet don hang</h1><p>Dang tai...</p></div>
  }

  if (error) {
    return <div className='order-detail'><h1>Chi tiet don hang</h1><p className='error-msg'>{error}</p></div>
  }

  if (!order) {
    return <div className='order-detail'><h1>Chi tiet don hang</h1><p>Khong tim thay don hang.</p></div>
  }

  const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
  const shippingFee = Number(order.shipping_fee) || 0
  const tax = Number(order.tax) || 0
  const totalAmount = subtotal + shippingFee + tax

  return (
    <div className='order-detail'>
      <h1>Chi tiet don hang</h1>
      <div className='order-detail-container'>
        <div className='order-detail-section'>
          <h2>Thong tin don hang</h2>
          <p><strong>Ma don hang:</strong> #{order.id}</p>
          <p><strong>Ngay dat:</strong> {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          <p><strong>Trang thai:</strong> <span className='status-label'>{order.status}</span></p>
        </div>

        <div className='order-detail-section'>
          <h2>Thong tin san pham</h2>
          {order.items?.map((item) => (
            <div
              key={item.id}
              className='order-product-item'
              style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}
            >
              <img
                src={resolveImageUrl(item.image)}
                alt={item.name}
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div className='order-product-info' style={{ flex: 1 }}>
                <p className='product-name' style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
                  <strong>{item.name}</strong>
                </p>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Ma SP: <strong>{item.code || 'N/A'}</strong></span>
                  <span style={{ margin: '0 10px' }}>|</span>
                  <span>Don vi: <strong>{item.unit || 'Cai'}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#475569' }}>
                    So luong: <strong>{item.quantity}</strong>
                    {item.size ? ` | Size: ${item.size}` : ''}
                  </p>
                  <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='order-detail-section'>
          <h2>Thong tin thanh toan</h2>
          <div className='payment-row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Tam tinh:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className='payment-row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Phi van chuyen:</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>
          <div className='payment-row total' style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc', fontWeight: 'bold', fontSize: '18px' }}>
            <span>Tong cong:</span>
            <span style={{ color: '#ef4444' }}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className='order-detail-section'>
          <h2>Thong tin giao hang</h2>
          <div className='shipping-info-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className='info-group'>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>NGUOI NHAN</p>
              <p className='val' style={{ margin: 0, fontWeight: '500' }}>{shippingInfo?.name || 'Chua cap nhat'}</p>
            </div>
            <div className='info-group'>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>DIA CHI</p>
              <p className='val' style={{ margin: 0, fontWeight: '500' }}>{shippingInfo?.address || 'Chua cap nhat'}</p>
            </div>
            <div className='info-group'>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>SO DIEN THOAI</p>
              <p className='val' style={{ margin: 0, fontWeight: '500' }}>{shippingInfo?.phone || 'Chua cap nhat'}</p>
            </div>
            <div className='info-group'>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>DON VI VAN CHUYEN</p>
              <p className='val' style={{ margin: 0, fontWeight: '500' }}>{order.shipping_method || 'Giao hang tieu chuan'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
