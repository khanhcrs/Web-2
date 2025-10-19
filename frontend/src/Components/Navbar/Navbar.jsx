import React, { useContext, useRef, useState, useEffect } from 'react'
import './Navbar.css'
import { Link, useNavigate } from 'react-router-dom'

import logo from '../assests/logo.png'
import cart_icon from '../assests/cart_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import nav_dropdown from '../assests/nav_dropdown.png'

const Navbar = () => {
    const [menu, setMenu] = useState("Cửa hàng")
    const { getTotalCartItems } = useContext(ShopContext)
    const menuRef = useRef()
    const navigate = useNavigate()
    // State để render lại navbar khi login/logout
    const [userName, setUserName] = useState(localStorage.getItem('user_name'))

    // Khi login xong, cập nhật lại user ngay lập tức (không cần reload)
    useEffect(() => {
        const syncUser = () => setUserName(localStorage.getItem('user_name'))
        window.addEventListener('storage', syncUser)
        return () => window.removeEventListener('storage', syncUser)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_name')
        setUserName(null)
        navigate('/')
    }

    const dropdown_toggle = (e) => {
        menuRef.current.classList.toggle('nav-menu-visible')
        e.target.classList.toggle('open')
    }

    return (
        <div className='navbar'>
            <div className="navbar-logo">
                <img src={logo} alt='' />
                <p>SHOPPER</p>
            </div>
            <img className='nav-dropdown' onClick={dropdown_toggle} src={nav_dropdown} alt="" />
            <ul ref={menuRef} className="nav-menu">
                <li onClick={() => { setMenu("Cửa hàng") }}><Link to='/' style={{ textDecoration: 'none' }} >Cửa hàng</Link>{menu === "Cửa hàng" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Đàn ông") }}><Link to='/mens' style={{ textDecoration: 'none' }} >Đàn ông</Link>{menu === "Đàn ông" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Phụ nữ") }}><Link to='/womens' style={{ textDecoration: 'none' }} >Phụ nữ</Link>{menu === "Phụ nữ" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Trẻ em") }}><Link to='/kids' style={{ textDecoration: 'none' }} >Trẻ em</Link>{menu === "Trẻ em" ? <hr /> : <></>}</li>
            </ul>
            <div className="nav-login-cart">
                {userName && (
                    <span className="nav-hello" style={{ marginRight: "25px", fontWeight: '500', color: '#444' }}>
                        Xin chào, {userName}
                    </span>
                )}
                {userName ? (
                    <button onClick={handleLogout}>Đăng xuất</button>
                ) : (
                    <Link to='/login'><button>Đăng nhập</button></Link>
                )}
                <Link to='/cart'><img src={cart_icon} alt='' /></Link>
                <div className="nav-cart-count">{getTotalCartItems()}</div>
            </div>
        </div>
    )
}

export default Navbar
