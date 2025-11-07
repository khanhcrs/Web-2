import React from 'react'
import './Footer.css'
import footer_logo from '../assests/logo_big.png'
import instagram_icon from '../assests/instagram_icon.png'
import pintester_icon from '../assests/pintester_icon.png'
import whatsapp_icon from '../assests/whatsapp_icon.png'

const Footer = () => {
    return (
        <div className='footer'>
            <div className="footer-logo">
                <img src={footer_logo} alt="" />
                <p>
                    SHOPPER
                </p>
            </div>
            <ul className="footer-links">
                <li>Về chúng tôi</li>
                <li>Sản phẩm</li>
                <li>Văn phòng</li>
                <li>Giới thiệu</li>
                <li>Liên hệ</li>

            </ul>
            <div className="footer-social-icon">
                <div className="footer-icons-container">
                    <img src={instagram_icon} alt="" />
                </div>
                <div className="footer-icons-container">
                    <img src={pintester_icon} alt="" />
                </div>
                <div className="footer-icons-container">
                    <img src={whatsapp_icon} alt="" />
                </div>
            </div>
            <div className="footer-copyright">
                <hr />
                <p>Bản quyền © 2023 - Đã đăng ký bản quyền</p>
            </div>
        </div>
    )
}

export default Footer
