import React, { useContext, useEffect, useState } from 'react'
import './CartItems.css'
import { useNavigate } from 'react-router-dom'
import { ShopContext } from '../../Context/ShopContext'
import { AuthContext } from '../../Context/AuthContext'
import remove_icon from '../assests/cart_cross_icon.png'
import cart_header_icon from '../assests/cart_icon.png'
import { resolveImageUrl } from '../../config'

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    loadingProducts,
    loadingCart,
    getTotalCartItems,
    addToCart,
    setCartItemQuantity
  } = useContext(ShopContext)
  const { isAuthenticated } = useContext(AuthContext)
  const navigate = useNavigate()
  const hasItemsInCart = getTotalCartItems() > 0
  const totalAmount = getTotalCartAmount()
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const formatCurrency = (value) => `${(Number(value) || 0).toLocaleString('vi-VN')}d`

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined
    }

    const timeout = setTimeout(() => setFeedbackMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [feedbackMessage])

  const handleCheckout = () => {
    if (!hasItemsInCart) {
      return
    }

    if (!isAuthenticated) {
      setFeedbackMessage('Vui long dang nhap de co the thanh toan.')
      return
    }

    navigate('/checkout')
  }

  return (
    <div className='cartitems'>
      <div className='cartitems-header'>
        <div className='cartitems-header-brand'>
          <img src={cart_header_icon} alt='' />
          <span>SHOPPER</span>
        </div>
        <button type='button' onClick={() => navigate('/')}>
          Tiep tuc mua hang
        </button>
      </div>

      <div className='cartitems-format-main'>
        <p>San pham</p>
        <p>Ten</p>
        <p>Gia</p>
        <p>So luong</p>
        <p>Tong</p>
        <p>Xoa</p>
      </div>
      <hr />

      {(loadingProducts || loadingCart) && <p className='cartitems-loading'>Dang tai san pham...</p>}

      {!loadingProducts && !loadingCart && Object.entries(cartItems).map(([key, quantity]) => {
        if (quantity <= 0) {
          return null
        }

        const [productId, size] = key.split('-')
        const product = products.find((entry) => entry.id === Number(productId))
        if (!product) {
          return null
        }

        return (
          <div key={key}>
            <div className='cartiems-format cartitems-format-main'>
              <img
                src={resolveImageUrl(product.image)}
                alt={product.name}
                className='carticon-product-icon'
              />
              <div>
                <p>{product.name}</p>
                {size && size !== 'default' && (
                  <p className='cartitems-size'>Kich thuoc: {size}</p>
                )}
              </div>
              <p>{formatCurrency(product.new_price)}</p>
              <div className='cartitems-quantity-control'>
                <button
                  type='button'
                  onClick={() => removeFromCart(product.id, size)}
                  aria-label='Giam so luong'
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type='button'
                  onClick={() => addToCart(product.id, size)}
                  aria-label='Tang so luong'
                >
                  +
                </button>
              </div>
              <p>{formatCurrency(product.new_price * quantity)}</p>
              <img
                src={remove_icon}
                onClick={() => setCartItemQuantity(product.id, size, 0)}
                alt='Xoa khoi gio'
                style={{ cursor: 'pointer' }}
              />
            </div>
            <hr />
          </div>
        )
      })}

      <div className='cartitems-down'>
        <div className='cartitems-total'>
          <h1>Tong gio hang</h1>
          <div>
            <div className='cartitems-total-item'>
              <p>Tam tinh</p>
              <p>{formatCurrency(totalAmount)}</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <p>Phi van chuyen</p>
              <p>Mien phi</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <h3>Tong cong</h3>
              <h3>{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={!hasItemsInCart}>
            TIEN HANH THANH TOAN
          </button>
          {feedbackMessage && (
            <p className='cartitems-feedback'>{feedbackMessage}</p>
          )}
        </div>
        <div className='cartitems-promocode'>
          <p>Neu ban co ma giam gia, hay nhap tai day</p>
          <div className='cartitems-promobox'>
            <input type='text' placeholder='Ma giam gia' />
            <button>Ap dung</button>
          </div>
        </div>
      </div>

      {!loadingProducts && !loadingCart && !hasItemsInCart && (
        <p className='cartitems-empty'>Gio hang cua ban dang trong.</p>
      )}
    </div>
  )
}

export default CartItems
