import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'
import './CSS/AccountProfile.css'

const ADDRESS_STORAGE_KEY = 'account_addresses'

const getAddressStore = () => {
  try {
    const stored = localStorage.getItem(ADDRESS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Không thể tải sổ địa chỉ.', error)
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

const AccountProfile = () => {
  const { user, logout } = useContext(AuthContext)
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [addressForm, setAddressForm] = useState(createEmptyForm)
  const [addresses, setAddresses] = useState([])

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

  if (!user) {
    if (hasStoredSession) return null
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

    if (Object.values(payload).some((value) => !value)) return

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
          <h1>THÔNG TIN TÀI KHOẢN</h1>
          <p className='account-profile-greeting'><strong>{user.name}</strong></p>

          <h2>Đơn hàng gần nhất</h2>
          <div className='account-profile-order-box'>
            <div className='account-profile-order-header'>
              <span>Đơn hàng #</span>
              <span>Ngày</span>
              <span>Chuyển đến</span>
              <span>Giá trị đơn hàng</span>
              <span>Tình trạng thanh toán</span>
            </div>
            <p className='account-profile-empty-order'>Không có đơn hàng nào.</p>
          </div>

          {showAddressBook && (
            <section className='account-address-book'>
              <div className='account-address-book-head'>
                <h3>Sổ địa chỉ</h3>
                <p>{addresses.length} địa chỉ đã lưu</p>
              </div>

              <form className='account-address-form' onSubmit={handleSubmitAddress}>
                <input
                  type='text'
                  name='fullName'
                  placeholder='Họ và tên người nhận'
                  value={addressForm.fullName}
                  onChange={handleAddressInput}
                  required
                />
                <input
                  type='tel'
                  name='phone'
                  placeholder='Số điện thoại'
                  value={addressForm.phone}
                  onChange={handleAddressInput}
                  required
                />
                <input
                  type='text'
                  name='street'
                  placeholder='Số nhà, tên đường'
                  value={addressForm.street}
                  onChange={handleAddressInput}
                  required
                />
                <div className='account-address-form-row'>
                  <input
                    type='text'
                    name='ward'
                    placeholder='Phường/Xã'
                    value={addressForm.ward}
                    onChange={handleAddressInput}
                    required
                  />
                  <input
                    type='text'
                    name='district'
                    placeholder='Quận/Huyện'
                    value={addressForm.district}
                    onChange={handleAddressInput}
                    required
                  />
                </div>
                <input
                  type='text'
                  name='city'
                  placeholder='Tỉnh/Thành phố'
                  value={addressForm.city}
                  onChange={handleAddressInput}
                  required
                />

                <div className='account-address-form-actions'>
                  <button type='submit' className='account-profile-btn'>
                    {editingId ? 'Lưu chỉnh sửa' : 'Thêm địa chỉ'}
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
                      Hủy sửa
                    </button>
                  )}
                </div>
              </form>

              <div className='account-address-list'>
                {addresses.length === 0 ? (
                  <p className='account-address-empty'>Bạn chưa có địa chỉ nào.</p>
                ) : (
                  addresses.map((address, index) => (
                    <article key={address.id} className='account-address-item'>
                      <p className='account-address-title'>Địa chỉ {index + 1}</p>
                      <p><strong>Người nhận:</strong> {address.fullName}</p>
                      <p><strong>SĐT:</strong> {address.phone}</p>
                      <p>
                        <strong>Địa chỉ:</strong> {address.street}, {address.ward}, {address.district}, {address.city}
                      </p>
                      <div className='account-address-item-actions'>
                        <button
                          type='button'
                          className='account-profile-btn account-profile-btn-secondary'
                          onClick={() => handleEditAddress(address)}
                        >
                          Sửa
                        </button>
                        <button
                          type='button'
                          className='account-profile-btn account-profile-btn-danger'
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          Xóa
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
          <p className='account-profile-side-title'>Tài khoản của tôi</p>
          <p className='account-profile-side-name'>
            Tên tài khoản: <strong>{user.name}</strong>
          </p>
          <button type='button' className='account-profile-btn' onClick={handleOpenAddressBook}>
            Sổ địa chỉ ({addresses.length})
          </button>
          <Link to='/' className='account-profile-btn account-profile-link-btn'>Thoát</Link>
          <button
            type='button'
            className='account-profile-btn account-profile-logout'
            onClick={logout}
          >
            Đăng xuất
          </button>
        </aside>
      </div>
    </div>
  )
}

export default AccountProfile