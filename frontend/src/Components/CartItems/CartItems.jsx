import React, { useContext } from 'react'
import './CartItems.css'
import { ShopContext } from '../../Context/ShopContext'
import remove_icon from '../assests/cart_cross_icon.png'
import { resolveImageUrl } from '../../config'

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    loadingProducts
  } = useContext(ShopContext)

  return (
    <div className='cartitems'>
      <div className='cartitems-format-main'>
        <p>Products</p>
        <p>Title</p>
        <p>Size</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {loadingProducts && <p className='cartitems-loading'>Đang tải sản phẩm...</p>}

      {!loadingProducts &&
        Object.entries(cartItems).map(([key, quantity]) => {
          if (quantity > 0) {
            const [productId, size] = key.split('-')
            const product = products.find(p => p.id === Number(productId))
            if (!product) return null

            return (
              <div key={key}>
                <div className='cartiems-format cartitems-format-main'>
                  <img
                    src={resolveImageUrl(product.image)}
                    alt={product.name}
                    className='carticon-product-icon'
                  />
                  <p>{product.name}</p>
                  <p>{size}</p>
                  <p>{product.new_price}đ</p>
                  <button className='cartitems-quantity'>
                    {quantity}
                  </button>
                  <p>{product.new_price * quantity}đ</p>
                  <img
                    src={remove_icon}
                    onClick={() => removeFromCart(product.id, size)}
                    alt='Xoá khỏi giỏ'
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <hr />
              </div>
            )
          }
          return null
        })
      }

      <div className='cartitems-down'>
        <div className='cartitems-total'>
          <h1>Cart Total</h1>
          <div>
            <div className='cartitems-total-item'>
              <p>Subtotal</p>
              <p>{getTotalCartAmount()}đ</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <h3>Total</h3>
              <h3>{getTotalCartAmount()}đ</h3>
            </div>
          </div>
          <button>PROCEED TO CHECKOUT</button>
        </div>
        <div className='cartitems-promocode'>
          <p>If you have a promo code, Enter it here</p>
          <div className='cartitems-promobox'>
            <input type='text' placeholder='promo code' />
            <button>Submit</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartItems
