import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProductDisplay.css'
import star_icon from '../assests/star_icon.png'
import star_dull_icon from '../assests/star_dull_icon.png'
import ProductReview from '../ProductReview/ProductReview'
import { ShopContext } from '../../Context/ShopContext'
import { resolveImageUrl } from '../../config'

const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL']

const ProductDisplay = ({ product }) => {
  const { addToCart } = useContext(ShopContext)
  const navigate = useNavigate()

  const resolvedImages = useMemo(() => {
    let imageList = []

    if (Array.isArray(product?.images)) {
      imageList = product.images
    } else if (typeof product?.images === 'string') {
      try {
        const parsed = JSON.parse(product.images)
        if (Array.isArray(parsed)) {
          imageList = parsed
        }
      } catch (error) {
        imageList = []
      }
    }

    const normalized = imageList
      .map((img) => resolveImageUrl(img))
      .filter(Boolean)

    const primary = resolveImageUrl(product?.image)
    if (primary && !normalized.includes(primary)) {
      normalized.unshift(primary)
    }

    return normalized.length ? normalized : primary ? [primary] : []
  }, [product])

  const [activeImage, setActiveImage] = useState(resolvedImages[0] || '')
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [sizeError, setSizeError] = useState('')

  useEffect(() => {
    setActiveImage(resolvedImages[0] || '')
  }, [resolvedImages])

  if (!product) {
    return null
  }

  const currentStock = Number(product.stock_quantity) || 0
  const isOutOfStock = currentStock <= 0
  const productImage = activeImage || resolvedImages[0] || resolveImageUrl(product?.image) || ''

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return
    }

    if (!selectedSize) {
      setSizeError('Vui long chon kich thuoc truoc khi them vao gio hang.')
      return
    }

    if (quantity > currentStock) {
      setSizeError(`Rat tiec, kho chi con lai ${currentStock} san pham.`)
      return
    }

    setSizeError('')
    addToCart(product.id, selectedSize, quantity)
    setIsFeedbackModalOpen(true)
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const nextValue = Math.max(prev + delta, 1)
      if (nextValue > currentStock) {
        return prev
      }
      return nextValue
    })
  }

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false)
  }

  const handleViewCart = () => {
    handleCloseFeedbackModal()
    navigate('/cart')
  }

  const handleContinueShopping = () => {
    handleCloseFeedbackModal()
    navigate('/')
  }

  return (
    <div className='product-page-container'>
      <div className='productdisplay'>
        <div className='productdisplay-left'>
          {resolvedImages.length > 0 && (
            <div className='productdisplay-img-list'>
              {resolvedImages.map((img) => (
                <button
                  key={img}
                  type='button'
                  className={img === activeImage ? 'productdisplay-thumbnail active' : 'productdisplay-thumbnail'}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={product.name} />
                </button>
              ))}
            </div>
          )}

          <div className='productdisplay-image-frame'>
            <img className='productdisplay-main-img' src={productImage} alt={product.name} />
          </div>
        </div>

        <div className='productdisplay-right'>
          <h1>{product.name}</h1>

          <div className='productdisplay-right-stars'>
            <img src={star_icon} alt='' />
            <img src={star_icon} alt='' />
            <img src={star_icon} alt='' />
            <img src={star_icon} alt='' />
            <img src={star_dull_icon} alt='' />
            <p>(122)</p>
          </div>

          <div className='productdisplay-right-prices'>
            <div className='productdisplay-right-price-old'>
              {Number(product.old_price).toLocaleString()}đ
            </div>
            <div className='productdisplay-right-price-new'>
              {Number(product.new_price).toLocaleString()}đ
            </div>
          </div>

          <div className='productdisplay-info-specs'>
            <div><strong>Ma SP:</strong> {product.code || 'Dang cap nhat'}</div>
            <div><strong>Danh muc:</strong> <span className='productdisplay-category-name'>{product.category}</span></div>
            <div><strong>Don vi tinh:</strong> {product.unit || 'Cai'}</div>
            <div>
              <strong>Tinh trang:</strong>{' '}
              {isOutOfStock ? (
                <span className='productdisplay-stock-pill out-of-stock'>Het hang</span>
              ) : (
                <span className='productdisplay-stock-pill in-stock'>
                  Con hang ({currentStock} {product.unit || 'Cai'})
                </span>
              )}
            </div>
          </div>

          <div className='productdisplay-right-size'>
            <h2>Chon kich thuoc</h2>
            <div className='productdisplay-right-sizes'>
              {sizeOptions.map((size) => (
                <button
                  type='button'
                  key={size}
                  disabled={isOutOfStock}
                  className={size === selectedSize ? 'productdisplay-size-option selected' : 'productdisplay-size-option'}
                  onClick={() => {
                    setSelectedSize(size)
                    setSizeError('')
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
            {sizeError && <p className='productdisplay-size-error'>{sizeError}</p>}
          </div>

          <div className='productdisplay-quantity'>
            <span>So luong</span>
            <div className='productdisplay-quantity-controls'>
              <button type='button' onClick={() => handleQuantityChange(-1)} disabled={isOutOfStock}>
                -
              </button>
              <span className='productdisplay-quantity-value'>{quantity}</span>
              <button
                type='button'
                onClick={() => handleQuantityChange(1)}
                disabled={isOutOfStock || quantity >= currentStock}
              >
                +
              </button>
            </div>
          </div>

          <button
            type='button'
            className='productdisplay-add-to-cart'
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Tam het hang' : 'Them vao gio'}
          </button>

          <div className='productdisplay-right-description'>
            <h4>Mo ta chi tiet</h4>
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p className='productdisplay-empty-description'>Chua co mo ta cho san pham nay.</p>
            )}
          </div>
        </div>

        {isFeedbackModalOpen && (
          <div className='productdisplay-feedback-backdrop'>
            <div className='productdisplay-feedback-modal' role='alertdialog' aria-modal='true'>
              <button type='button' className='productdisplay-feedback-close' onClick={handleCloseFeedbackModal}>
                x
              </button>
              <div className='productdisplay-feedback-icon'>✓</div>
              <h2>Them vao gio hang thanh cong</h2>
              <div className='productdisplay-feedback-product-info'>
                <img className='productdisplay-feedback-product-image' src={productImage} alt={product.name} />
                <div className='productdisplay-feedback-product-details'>
                  <p className='productdisplay-feedback-product'>{product.name}</p>
                  {selectedSize && <p className='productdisplay-feedback-size'>Kich thuoc: {selectedSize}</p>}
                  <p className='productdisplay-feedback-quantity'>So luong: {quantity}</p>
                </div>
              </div>
              <div className='productdisplay-feedback-actions'>
                <button type='button' className='continue' onClick={handleContinueShopping}>
                  Tiep tuc mua sam
                </button>
                <button type='button' className='view-cart' onClick={handleViewCart}>
                  Xem gio hang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='product-review-wrapper'>
        <ProductReview productId={product.id} />
      </div>
    </div>
  )
}

export default ProductDisplay
