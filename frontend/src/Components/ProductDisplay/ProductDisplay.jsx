import React, { useContext, useEffect, useMemo, useState } from 'react'
import './ProductDisplay.css'
import star_icon from '../assests/star_icon.png'
import star_dull_icon from '../assests/star_dull_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import { resolveImageUrl } from '../../config'

const ProductDisplay = (props) => {
  const { product } = props
  const { addToCart } = useContext(ShopContext)
  const productImage = resolveImageUrl(product?.image)
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const sizeOptions = useMemo(() => ['S', 'M', 'L', 'XL', 'XXL'], [])

  useEffect(() => {
    if (!feedbackMessage) return
    const timeout = setTimeout(() => setFeedbackMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [feedbackMessage])

  if (!product) {
    return null
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
    setFeedbackMessage('Đã thêm sản phẩm vào giỏ hàng thành công!')
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const nextValue = Math.max(prev + delta, 1)
      return nextValue
    })
  }

  return (
    <div className='productdisplay'>
      <div className='productdisplay-left'>
        <div className='productdisplay-img-list'>
          <img src={productImage} alt='' />
          <img src={productImage} alt='' />
          <img src={productImage} alt='' />
          <img src={productImage} alt='' />
        </div>
        <div className='prodcutdisplay-img'>
          <img className='prodcutdisplay-main-img' src={productImage} alt='' />
        </div>
      </div>
      <div className='productdisplay-right'>
        <h1>{product.name}</h1>
        <div className='productdisplay-right-star'>
          <img src={star_icon} alt='' />
          <img src={star_icon} alt='' />
          <img src={star_icon} alt='' />
          <img src={star_icon} alt='' />
          <img src={star_dull_icon} alt='' />
          <p>(122)</p>
        </div>
        <div className='productdisplay-right-prices'>
          <div className='productdisplay-right-price-old'>
            {product.old_price}đ
          </div>
          <div className='productdisplay-right-price-new'>
            {product.new_price}đ
          </div>
        </div>
        <div className='productdisplay-right-description'></div>
        <div className='productdisplay-right-size'>
          <h1>Chọn kích thước</h1>
          <div className='productdisplay-right-sizes'>
            {sizeOptions.map((size) => (
              <button
                type='button'
                key={size}
                className={
                  size === selectedSize
                    ? 'productdisplay-size-option selected'
                    : 'productdisplay-size-option'
                }
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className='productdisplay-quantity'>
          <span>Số lượng</span>
          <div className='productdisplay-quantity-controls'>
            <button
              type='button'
              onClick={() => handleQuantityChange(-1)}
              aria-label='Giảm số lượng'
            >
              −
            </button>
            <span className='productdisplay-quantity-value'>{quantity}</span>
            <button
              type='button'
              onClick={() => handleQuantityChange(1)}
              aria-label='Tăng số lượng'
            >
              +
            </button>
          </div>
        </div>
        <button onClick={handleAddToCart}>THÊM VÀO GIỎ</button>
        {feedbackMessage && (
          <p className='productdisplay-feedback'>{feedbackMessage}</p>
        )}
        <p className='productdisplay-right-category'>
          <span>Danh mục: </span>Phụ nữ, Áo thun, Áo croptop
        </p>
        <p className='productdisplay-right-category'>
          <span>Thẻ: </span>Hiện đại, Mới nhất
        </p>
      </div>
    </div>
  )
}

export default ProductDisplay
