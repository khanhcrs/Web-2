import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CSS/OrderHistory.css'
import { AuthContext } from '../Context/AuthContext'
import { resolveImageUrl } from '../config'
import { getMyOrders } from '../services/orderService'

const formatCurrency = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')} VND`

const OrderHistory = () => {
  const { token } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const fetchOrders = async () => {
      if (!token) {
        setError('Vui long dang nhap de xem lich su don hang.')
        setLoading(false)
        return
      }

      try {
        const data = await getMyOrders(token)
        if (!ignore) {
          const sortedOrders = [...data].sort(
            (left, right) => new Date(right.created_at) - new Date(left.created_at)
          )
          setOrders(sortedOrders)
          setError('')
        }
      } catch (fetchError) {
        if (!ignore) {
          setOrders([])
          setError(fetchError.message || 'Khong the tai lich su don hang.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      ignore = true
    }
  }, [token])

  if (loading) {
    return <div className='order-history'><h1>Don hang cua toi</h1><p>Dang tai...</p></div>
  }

  if (error) {
    return <div className='order-history'><h1>Don hang cua toi</h1><p>{error}</p></div>
  }

  return (
    <div className='order-history'>
      <h1>Don hang cua toi</h1>
      <div className='order-history-container'>
        {orders.length === 0 ? (
          <p>Ban chua co don hang nao.</p>
        ) : (
          orders.map((order) => (
            <Link to={`/order/${order.id}`} key={order.id} className='order-item-link'>
              <div className='order-item'>
                <div className='order-item-header'>
                  <h3>Don #{order.id}</h3>
                  <p>Ngay dat: {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                </div>

                <div className='order-item-body'>
                  {order.items.map((item) => (
                    <div key={item.id} className='order-product'>
                      <img src={resolveImageUrl(item.image)} alt={item.name} />
                      <div className='order-product-info'>
                        <p>{item.name}</p>
                        <p>So luong: {item.quantity}</p>
                        <p>Don gia: {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='order-item-footer'>
                  <p>Tong tien: {formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderHistory
