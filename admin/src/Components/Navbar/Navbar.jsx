import React from 'react'
import './Navbar.css'
import navLogo from '../../assets/nav-logo.svg'
import navProfile from '../../assets/nav-profile.svg'

const Navbar = ({ user, onLogout }) => {
  return (
    <div className='navbar'>
      <img src={navLogo} alt='' className='nav-logo' />
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{user?.name || 'Admin'}</div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>{user?.email || 'admin@clothify.com'}</div>
        </div>
        <img src={navProfile} className='nav-profile' alt='' />
        <button
          type='button'
          onClick={onLogout}
          style={{ border: 'none', borderRadius: '999px', background: '#0f172a', color: 'white', padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}
        >
          Dang xuat
        </button>
      </div>
    </div>
  )
}

export default Navbar
