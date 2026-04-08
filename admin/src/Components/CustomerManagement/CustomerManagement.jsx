import React, { useEffect, useState } from 'react'
import './CustomerManagement.css'
import { listUsers, updateUserRole, updateUserStatus } from '../../services/userService'

const statusDictionary = {
  active: 'Hoat dong',
  suspended: 'Bi khoa'
}

const roleDictionary = {
  admin: 'Quan tri vien',
  customer: 'Khach hang'
}

const DEFAULT_ADMIN_EMAIL = 'admin@clothify.com'

const mapUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  status: user.status,
  role: user.role || 'customer',
  createdAt: user.createdAt
})

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchCustomers = async () => {
    setLoading(true)
    setError('')

    try {
      const users = await listUsers()
      setCustomers(users.map(mapUser))
    } catch (fetchError) {
      setError(fetchError.message || 'Khong the tai danh sach khach hang.')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleUpdateRole = async (customer, nextRole) => {
    if (nextRole === customer.role) {
      setFeedback('Vai tro da duoc thiet lap nhu hien tai.')
      return
    }

    setUpdatingId(customer.id)
    setError('')
    setFeedback('')

    try {
      const data = await updateUserRole(customer.id, nextRole)
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id ? { ...item, role: data.user.role || nextRole } : item
        )
      )
      setFeedback('Da cap nhat vai tro khach hang.')
    } catch (updateError) {
      setError(updateError.message || 'Khong the cap nhat vai tro tai khoan.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleStatus = async (customer) => {
    const nextStatus = customer.status === 'active' ? 'suspended' : 'active'

    setUpdatingId(customer.id)
    setError('')
    setFeedback('')

    try {
      const data = await updateUserStatus(customer.id, nextStatus)
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id ? { ...item, status: data.user.status || nextStatus } : item
        )
      )
      setFeedback('Da cap nhat trang thai khach hang.')
    } catch (updateError) {
      setError(updateError.message || 'Khong the cap nhat trang thai tai khoan.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className='customer-management'>
      <div className='customer-management-header'>
        <div>
          <h2>Quan ly khach hang</h2>
          <p>Theo doi tai khoan dang ky tu trang nguoi dung.</p>
        </div>
        <button type='button' onClick={fetchCustomers} disabled={loading}>
          {loading ? 'Dang tai...' : 'Tai lai'}
        </button>
      </div>

      {error && <div className='customer-management-alert error'>{error}</div>}
      {feedback && <div className='customer-management-alert success'>{feedback}</div>}

      <div className='customer-table-wrapper'>
        <table className='customer-table'>
          <thead>
            <tr>
              <th>Khach hang</th>
              <th>Email</th>
              <th>Ngay tao</th>
              <th>Vai tro</th>
              <th>Trang thai</th>
              <th>Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className='customer-table-empty'>Dang tai du lieu...</td>
              </tr>
            )}

            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={6} className='customer-table-empty'>Chua co khach hang nao.</td>
              </tr>
            )}

            {!loading && customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>
                  {customer.createdAt
                    ? new Date(customer.createdAt).toLocaleString('vi-VN')
                    : 'Khong xac dinh'}
                </td>
                <td>
                  <select
                    className='customer-role-select'
                    value={customer.role}
                    onChange={(event) => handleUpdateRole(customer, event.target.value)}
                    disabled={
                      updatingId === customer.id ||
                      (customer.email || '').toLowerCase() === DEFAULT_ADMIN_EMAIL
                    }
                  >
                    <option value='customer'>{roleDictionary.customer}</option>
                    <option value='admin'>{roleDictionary.admin}</option>
                  </select>
                  {(customer.email || '').toLowerCase() === DEFAULT_ADMIN_EMAIL && (
                    <p className='customer-note'>Tai khoan quan tri mac dinh</p>
                  )}
                </td>
                <td>
                  <span className={`customer-status status-${customer.status}`}>
                    {statusDictionary[customer.status] || customer.status}
                  </span>
                </td>
                <td>
                  <button
                    type='button'
                    onClick={() => handleToggleStatus(customer)}
                    disabled={
                      updatingId === customer.id ||
                      (customer.email || '').toLowerCase() === DEFAULT_ADMIN_EMAIL
                    }
                  >
                    {customer.status === 'active' ? 'Khoa' : 'Mo khoa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default CustomerManagement
