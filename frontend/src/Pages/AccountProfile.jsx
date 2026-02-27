import React, { useContext } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'
import './CSS/AccountProfile.css'

const AccountProfile = () => {
  const { user, logout } = useContext(AuthContext)

  if (!user) {
    return <Navigate to='/login' replace />
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
          <button type='button' className='account-profile-btn'>Sổ địa chỉ (0)</button>
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
