import React from 'react'
import './NewsLetter.css'
export const NewsLetter = () => {
  return (
    <div className='newsLetter'>
            <h1>Nhận ưu đãi độc quyền qua email</h1>
            <p>Đăng ký nhận bản tin để luôn được cập nhật</p>
            <div>
                <input type="email" placeholder='Nhập email của bạn' />
                <button>Đăng ký</button>
            </div>
        </div>
  )
}
