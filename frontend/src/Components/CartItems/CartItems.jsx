import React, { useContext, useEffect, useState } from 'react'
import './CartItems.css'
import { ShopContext } from '../../Context/ShopContext'
import remove_icon from '../assests/cart_cross_icon.png'
import { resolveImageUrl } from '../../config'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../Context/AuthContext'

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    loadingProducts,
    getTotalCartItems,
    addToCart,
    setCartItemQuantity
  } = useContext(ShopContext)
  const { isAuthenticated } = useContext(AuthContext)
  const navigate = useNavigate()
  const hasItemsInCart = getTotalCartItems() > 0
  const totalAmount = getTotalCartAmount()
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const formatCurrency = (value) => {
    const amount = Number(value) || 0
    return `${amount.toLocaleString('vi-VN')}đ`
  }

  useEffect(() => {
    if (!feedbackMessage) return
    const timeout = setTimeout(() => setFeedbackMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [feedbackMessage])

  const handleCheckout = () => {
    if (!hasItemsInCart) {
      return
    }

    if (!isAuthenticated) {
      setFeedbackMessage('Vui lòng đăng nhập để có thể thanh toán.')
      return
    }

    navigate('/checkout')
  }

  return (
    <div className='cartitems'>
      <div className='cartitems-format-main'>
        <p>Sản phẩm</p>
        <p>Tên</p>
        <p>Giá</p>
        <p>Số lượng</p>
        <p>Tổng</p>
        <p>Xoá</p>
      </div>
      <hr />
      {loadingProducts && <p className='cartitems-loading'>Đang tải sản phẩm...</p>}
      {!loadingProducts &&
        products.map((product) => {
          if (cartItems[product.id] > 0) {
            return (
              <div key={product.id}>
                <div className='cartiems-format cartitems-format-main'>
                  <img
                    src={resolveImageUrl(product.image)}
                    alt={product.name}
                    className='carticon-product-icon'
                  />
                  <p>{product.name}</p>
                  <p>{formatCurrency(product.new_price)}</p>
                  <div className='cartitems-quantity-control'>
                    <button
                      type='button'
                      onClick={() => removeFromCart(product.id)}
                      aria-label='Giảm số lượng'
                    >
                      −
                    </button>
                    <span>{cartItems[product.id]}</span>
                    <button
                      type='button'
                      onClick={() => addToCart(product.id)}
                      aria-label='Tăng số lượng'
                    >
                      +
                    </button>
                  </div>
                  <p>{formatCurrency(product.new_price * cartItems[product.id])}</p>
                  <img
                    src={remove_icon}
                    onClick={() => setCartItemQuantity(product.id, 0)}
                    alt='Xoá khỏi giỏ'
                  />
                </div>
                <hr />
              </div>
            )
          }
          return null
        })}
      <div className='cartitems-down'>
        <div className='cartitems-total'>
          <h1>Tổng giỏ hàng</h1>
          <div>
            <div className='cartitems-total-item'>
              <p>Tạm tính</p>
              <p>{formatCurrency(totalAmount)}</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <p>Phí vận chuyển</p>
              <p>Miễn phí</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <h3>Tổng cộng</h3>
              <h3>{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={!hasItemsInCart}>
            TIẾN HÀNH THANH TOÁN
          </button>
          {feedbackMessage && (
            <p className='cartitems-feedback'>{feedbackMessage}</p>
          )}
        </div>
        <div className='cartitems-promocode'>
          <p>Nếu bạn có mã giảm giá, hãy nhập tại đây</p>
          <div className='cartitems-promobox'>
            <input type='text' placeholder='Mã giảm giá' />
            <button>Áp dụng</button>
          </div>
        </div>
      </div>
      {!loadingProducts && !hasItemsInCart && (
        <p className='cartitems-empty'>Giỏ hàng của bạn đang trống.</p>
      )}
    </div>
  )
}

export default CartItems
