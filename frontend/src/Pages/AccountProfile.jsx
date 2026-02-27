import React, { useContext, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'
import { API_BASE_URL } from '../config'
import './CSS/AccountProfile.css'

const AccountProfile = () => {
  const { user, token, updateUser, logout } = useContext(AuthContext)
  const [newAddress, setNewAddress] = useState('')
  const [savingAddressBook, setSavingAddressBook] = useState(false)
  const [addressBookError, setAddressBookError] = useState('')

  const addressBook = useMemo(
    () => (Array.isArray(user?.addressBook) ? user.addressBook : []),
    [user]
  )

  if (!user) {
    return <Navigate to='/login' replace />
  }

  const saveAddressBook = async (nextAddresses) => {
    if (!token) {
      setAddressBookError('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.')
      return
    }

    setSavingAddressBook(true)
    setAddressBookError('')

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token,
        },
        body: JSON.stringify({ addresses: nextAddresses }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật sổ địa chỉ.')
      }

      if (data.user) {
        updateUser(data.user)
      } else {
        updateUser({ ...user, addressBook: data.addresses || [] })
      }
    } catch (error) {
      setAddressBookError(error.message || 'Không thể cập nhật sổ địa chỉ.')
    } finally {
      setSavingAddressBook(false)
    }
  }

  const handleAddAddress = async (event) => {
    event.preventDefault()
    const trimmedAddress = newAddress.trim()

    if (!trimmedAddress) {
      setAddressBookError('Vui lòng nhập địa chỉ trước khi thêm.')
      return
    }

    if (addressBook.includes(trimmedAddress)) {
      setAddressBookError('Địa chỉ này đã có trong sổ địa chỉ.')
      return
    }

    await saveAddressBook([...addressBook, trimmedAddress])
    setNewAddress('')
  }

  const handleRemoveAddress = async (indexToRemove) => {
    const nextAddresses = addressBook.filter((_, index) => index !== indexToRemove)
    await saveAddressBook(nextAddresses)
  }

  return (
    <div className='account-profile-page'>
      <div className='account-profile-container'>
        <div className='account-profile-main'>
          <h1>THÔNG TIN TÀI KHOẢN</h1>
          <p className='account-profile-greeting'>Xin chào, <strong>{user.name}</strong></p>

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
        </div>

        <aside className='account-profile-sidebar'>
          <p className='account-profile-side-title'>Tài khoản của tôi</p>
          <p className='account-profile-side-name'>
            Tên tài khoản: <strong>{user.name}</strong>
          </p>

          <div className='account-profile-address-book'>
            <p className='account-profile-address-title'>Sổ địa chỉ ({addressBook.length})</p>
            <form onSubmit={handleAddAddress} className='account-profile-address-form'>
              <textarea
                value={newAddress}
                onChange={(event) => setNewAddress(event.target.value)}
                placeholder='Số nhà, đường, quận/huyện, tỉnh/thành phố'
                rows={3}
                disabled={savingAddressBook}
              />
              <button type='submit' className='account-profile-btn' disabled={savingAddressBook}>
                {savingAddressBook ? 'Đang lưu...' : 'Thêm địa chỉ'}
              </button>
            </form>

            {addressBookError && (
              <p className='account-profile-address-error'>{addressBookError}</p>
            )}

            <ul className='account-profile-address-list'>
              {addressBook.map((address, index) => (
                <li key={`${address}-${index}`}>
                  <span>{address}</span>
                  <button
                    type='button'
                    className='account-profile-address-remove'
                    onClick={() => handleRemoveAddress(index)}
                    disabled={savingAddressBook}
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          </div>

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
