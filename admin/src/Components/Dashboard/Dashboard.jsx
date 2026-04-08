import React, { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
import { listOrders } from '../../services/orderService'
import { listUsers } from '../../services/userService'

const formatCurrency = (amount) => {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numeric)
}

const normalizeDate = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const Dashboard = () => {
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const [orderData, userData] = await Promise.all([
          listOrders(),
          listUsers()
        ])

        if (!ignore) {
          setOrders(orderData)
          setUsers(userData)
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(fetchError.message || 'Khong the tai du lieu tong quan.')
          setOrders([])
          setUsers([])
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [])

  const now = useMemo(() => new Date(), [])

  const metrics = useMemo(() => {
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const revenue = { today: 0, month: 0 }
    let totalOrders = 0
    let needingAction = 0

    const productMap = new Map()

    orders.forEach((order) => {
      const createdAt = normalizeDate(order.createdAt)
      const isCancelled = order.status === 'cancelled'
      const orderTotal = Number(order.total) || 0

      totalOrders += 1

      if (['pending', 'processing'].includes(order.status)) {
        needingAction += 1
      }

      if (!isCancelled && createdAt) {
        if (createdAt >= startOfToday) {
          revenue.today += orderTotal
        }

        if (createdAt >= startOfMonth) {
          revenue.month += orderTotal
        }
      }

      if (isCancelled || !Array.isArray(order.items)) {
        return
      }

      order.items.forEach((item, index) => {
        const key = item.productId || item.code || `${order.orderId}-${index}`

        if (!productMap.has(key)) {
          productMap.set(key, {
            name: item.name || `San pham #${item.productId || productMap.size + 1}`,
            quantity: 0,
            revenue: 0
          })
        }

        const current = productMap.get(key)
        const quantity = Number(item.quantity) || 0
        const price = Number(item.price) || 0

        current.quantity += quantity
        current.revenue += quantity * price
      })
    })

    const bestSellers = Array.from(productMap.values())
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5)

    const latestUsers = [...users]
      .map((user) => ({ ...user, normalizedCreatedAt: normalizeDate(user.createdAt) }))
      .sort((left, right) => (right.normalizedCreatedAt?.getTime() || 0) - (left.normalizedCreatedAt?.getTime() || 0))

    const newUsers = { today: 0, month: 0, latest: latestUsers.slice(0, 6) }

    latestUsers.forEach((user) => {
      if (!user.normalizedCreatedAt) {
        return
      }

      if (user.normalizedCreatedAt >= startOfToday) {
        newUsers.today += 1
      }

      if (user.normalizedCreatedAt >= startOfMonth) {
        newUsers.month += 1
      }
    })

    return {
      revenue,
      totalOrders,
      needingAction,
      bestSellers,
      newUsers
    }
  }, [now, orders, users])

  return (
    <div className='dashboard'>
      <div className='dashboard-header'>
        <div>
          <p className='eyebrow'>Tong quan</p>
          <h1>Bang dieu khien</h1>
          <p className='subtitle'>Nam nhanh doanh thu, don hang, san pham va nguoi dung moi.</p>
        </div>
        {loading && <span className='tag'>Dang tai...</span>}
      </div>

      {error && <div className='dashboard-alert error'>{error}</div>}

      <section className='dashboard-grid'>
        <article className='stat-card'>
          <p>Doanh thu hom nay</p>
          <h2>{formatCurrency(metrics.revenue.today)}</h2>
          <span className='badge neutral'>Khong tinh don da huy</span>
        </article>
        <article className='stat-card'>
          <p>Doanh thu thang nay</p>
          <h2>{formatCurrency(metrics.revenue.month)}</h2>
          <span className='badge neutral'>Khong tinh don da huy</span>
        </article>
        <article className='stat-card'>
          <p>Tong so don</p>
          <h2>{metrics.totalOrders}</h2>
          <span className='badge accent'>Don da ghi nhan</span>
        </article>
        <article className='stat-card'>
          <p>Don can xu ly</p>
          <h2>{metrics.needingAction}</h2>
          <span className='badge warning'>Pending / Processing</span>
        </article>
      </section>

      <section className='dashboard-panels'>
        <article className='panel'>
          <div className='panel-header'>
            <div>
              <p className='eyebrow'>Ban chay</p>
              <h3>San pham duoc mua nhieu</h3>
            </div>
            <span className='tag'>{metrics.bestSellers.length} san pham</span>
          </div>
          {metrics.bestSellers.length === 0 ? (
            <p className='empty'>Chua co du lieu ban hang.</p>
          ) : (
            <table className='data-table'>
              <thead>
                <tr>
                  <th>San pham</th>
                  <th>Da ban</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {metrics.bestSellers.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className='panel'>
          <div className='panel-header'>
            <div>
              <p className='eyebrow'>Nguoi dung moi</p>
              <h3>Tang truong khach hang</h3>
            </div>
            <div className='tag-group'>
              <span className='tag'>{metrics.newUsers.today} hom nay</span>
              <span className='tag neutral'>{metrics.newUsers.month} thang nay</span>
            </div>
          </div>
          {metrics.newUsers.latest.length === 0 ? (
            <p className='empty'>Chua co nguoi dung moi.</p>
          ) : (
            <div className='user-list'>
              {metrics.newUsers.latest.map((user, index) => (
                <div key={`${user.email}-${index}`} className='user-row'>
                  <div>
                    <p className='user-name'>{user.name}</p>
                    <p className='user-email'>{user.email}</p>
                  </div>
                  <div className='user-meta'>
                    <span className={`status-pill status-${user.status || 'active'}`}>
                      {user.status === 'suspended' ? 'Bi khoa' : 'Hoat dong'}
                    </span>
                    <span className='user-date'>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                        : 'Khong ro'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default Dashboard
