import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import './CSS/AccountProfile.css'
import { AuthContext } from '../Context/AuthContext'
import { getMyOrders } from '../services/orderService'

const ADDRESS_STORAGE_KEY = 'account_addresses'

const getAddressStore = () => {
  try {
    const stored = localStorage.getItem(ADDRESS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Khong the tai so dia chi.', error)
    return {}
  }
}

const saveAddressStore = (store) => {
  localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(store))
}

const createEmptyForm = () => ({
  fullName: '',
  phone: '',
  street: '',
  ward: '',
  district: '',
  city: ''
})

const formatCurrency = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')} VND`

const statusLabel = (status) => {
  switch (status) {
    case 'pending':
      return 'Cho xu ly'
    case 'processing':
      return 'Dang xu ly'
    case 'confirmed':
      return 'Da xac nhan'
    case 'shipped':
      return 'Da giao don vi van chuyen'
    case 'delivered':
      return 'Da giao'
    case 'cancelled':
      return 'Da huy'
    default:
      return status || 'Chua cap nhat'
  }
}

const AccountProfile = () => {
  const { user, token, logout } = useContext(AuthContext)
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [addressForm, setAddressForm] = useState(createEmptyForm)
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const userKey = useMemo(() => user?.id || user?.email || user?.name, [user])
  const hasStoredSession = useMemo(() => {
    try {
      return Boolean(localStorage.getItem('auth_token') && localStorage.getItem('auth_user'))
    } catch (error) {
      return false
    }
  }, [])

  useEffect(() => {
    if (!userKey) {
      setAddresses([])
      return
    }

    const store = getAddressStore()
    setAddresses(Array.isArray(store[userKey]) ? store[userKey] : [])
  }, [userKey])

  useEffect(() => {
    let ignore = false

    const fetchOrders = async () => {
      if (!token) {
        setOrders([])
        setOrdersError('')
        return
      }

      setOrdersLoading(true)

      try {
        const data = await getMyOrders(token)
        if (!ignore) {
          setOrders(data.slice(0, 5))
          setOrdersError('')
        }
      } catch (fetchError) {
        if (!ignore) {
          setOrders([])
          setOrdersError(fetchError.message || 'Khong the tai don hang gan day.')
        }
      } finally {
        if (!ignore) {
          setOrdersLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      ignore = true
    }
  }, [token])

  if (!user) {
    if (hasStoredSession) {
      return null
    }

    return <Navigate to='/login' replace />
  }

  const updateUserAddresses = (nextAddresses) => {
    const store = getAddressStore()
    store[userKey] = nextAddresses
    saveAddressStore(store)
    setAddresses(nextAddresses)
  }

  const handleAddressInput = (event) => {
    const { name, value } = event.target
    setAddressForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitAddress = (event) => {
    event.preventDefault()

    const payload = {
      id: editingId || `addr_${Date.now()}`,
      fullName: addressForm.fullName.trim(),
      phone: addressForm.phone.trim(),
      street: addressForm.street.trim(),
      ward: addressForm.ward.trim(),
      district: addressForm.district.trim(),
      city: addressForm.city.trim()
    }

    if (Object.values(payload).some((value) => !value)) {
      return
    }

    const nextAddresses = editingId
      ? addresses.map((item) => (item.id === editingId ? payload : item))
      : [...addresses, payload]

    updateUserAddresses(nextAddresses)
    setEditingId(null)
    setAddressForm(createEmptyForm())
  }

  const handleEditAddress = (address) => {
    setEditingId(address.id)
    setAddressForm({
      fullName: address.fullName || '',
      phone: address.phone || '',
      street: address.street || '',
      ward: address.ward || '',
      district: address.district || '',
      city: address.city || ''
    })
    setShowAddressBook(true)
  }

  const handleDeleteAddress = (addressId) => {
    const nextAddresses = addresses.filter((item) => item.id !== addressId)
    updateUserAddresses(nextAddresses)

    if (editingId === addressId) {
      setEditingId(null)
      setAddressForm(createEmptyForm())
    }
  }

  const handleOpenAddressBook = () => {
    setShowAddressBook((prev) => {
      if (prev) {
        setEditingId(null)
        setAddressForm(createEmptyForm())
      }

      return !prev
    })
  }

  return (
    <div className='account-profile-page'>
      <div className='account-profile-container'>
        <div className='account-profile-main'>
          <h1>THONG TIN TAI KHOAN</h1>
          <p className='account-profile-greeting'><strong>{user.name}</strong></p>

          <div className='account-profile-section-head'>
            <h2>Don hang gan nhat</h2>
            <Link to='/orders' className='account-profile-orders-link'>Xem tat ca</Link>
          </div>

          <div className='account-profile-order-box'>
            <div className='account-profile-order-header'>
              <span>Don hang</span>
              <span>Ngay</span>
              <span>So san pham</span>
              <span>Gia tri</span>
              <span>Trang thai</span>
            </div>

            {ordersLoading && <p className='account-profile-empty-order'>Dang tai don hang...</p>}
            {!ordersLoading && ordersError && <p className='account-profile-empty-order'>{ordersError}</p>}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <p className='account-profile-empty-order'>Ban chua co don hang nao.</p>
            )}

            {!ordersLoading && !ordersError && orders.map((order) => (
              <Link key={order.id} to={`/order/${order.id}`} className='account-profile-order-row'>
                <span>#{order.id}</span>
                <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                <span>{order.items?.length || 0}</span>
                <span>{formatCurrency(order.total_amount)}</span>
                <span>{statusLabel(order.status)}</span>
              </Link>
            ))}
          </div>

          {showAddressBook && (
            <section className='account-address-book'>
              <div className='account-address-book-head'>
                <h3>So dia chi</h3>
                <p>{addresses.length} dia chi da luu</p>
              </div>

              <form className='account-address-form' onSubmit={handleSubmitAddress}>
                <input
                  type='text'
                  name='fullName'
                  placeholder='Ho va ten nguoi nhan'
                  value={addressForm.fullName}
                  onChange={handleAddressInput}
                  required
                />
                <input
                  type='tel'
                  name='phone'
                  placeholder='So dien thoai'
                  value={addressForm.phone}
                  onChange={handleAddressInput}
                  required
                />
                <input
                  type='text'
                  name='street'
                  placeholder='So nha, ten duong'
                  value={addressForm.street}
                  onChange={handleAddressInput}
                  required
                />
                <div className='account-address-form-row'>
                  <input
                    type='text'
                    name='ward'
                    placeholder='Phuong/Xa'
                    value={addressForm.ward}
                    onChange={handleAddressInput}
                    required
                  />
                  <input
                    type='text'
                    name='district'
                    placeholder='Quan/Huyen'
                    value={addressForm.district}
                    onChange={handleAddressInput}
                    required
                  />
                </div>
                <input
                  type='text'
                  name='city'
                  placeholder='Tinh/Thanh pho'
                  value={addressForm.city}
                  onChange={handleAddressInput}
                  required
                />

                <div className='account-address-form-actions'>
                  <button type='submit' className='account-profile-btn'>
                    {editingId ? 'Luu chinh sua' : 'Them dia chi'}
                  </button>
                  {editingId && (
                    <button
                      type='button'
                      className='account-profile-btn account-profile-btn-secondary'
                      onClick={() => {
                        setEditingId(null)
                        setAddressForm(createEmptyForm())
                      }}
                    >
                      Huy sua
                    </button>
                  )}
                </div>
              </form>

              <div className='account-address-list'>
                {addresses.length === 0 ? (
                  <p className='account-address-empty'>Ban chua co dia chi nao.</p>
                ) : (
                  addresses.map((address, index) => (
                    <article key={address.id} className='account-address-item'>
                      <p className='account-address-title'>Dia chi {index + 1}</p>
                      <p><strong>Nguoi nhan:</strong> {address.fullName}</p>
                      <p><strong>SDT:</strong> {address.phone}</p>
                      <p>
                        <strong>Dia chi:</strong> {address.street}, {address.ward}, {address.district}, {address.city}
                      </p>
                      <div className='account-address-item-actions'>
                        <button
                          type='button'
                          className='account-profile-btn account-profile-btn-secondary'
                          onClick={() => handleEditAddress(address)}
                        >
                          Sua
                        </button>
                        <button
                          type='button'
                          className='account-profile-btn account-profile-btn-danger'
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          Xoa
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        <aside className='account-profile-sidebar'>
          <p className='account-profile-side-title'>Tai khoan cua toi</p>
          <p className='account-profile-side-name'>
            Ten tai khoan: <strong>{user.name}</strong>
          </p>
          <button type='button' className='account-profile-btn' onClick={handleOpenAddressBook}>
            So dia chi ({addresses.length})
          </button>
          <Link to='/' className='account-profile-btn account-profile-link-btn'>Thoat</Link>
          <button
            type='button'
            className='account-profile-btn account-profile-logout'
            onClick={logout}
          >
            Dang xuat
          </button>
        </aside>
      </div>
    </div>
  )
}

export default AccountProfile
