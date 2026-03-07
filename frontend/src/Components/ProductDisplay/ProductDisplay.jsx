import React, { useContext, useEffect, useMemo, useState } from 'react'
import './ProductDisplay.css'
import star_icon from '../assests/star_icon.png'
import star_dull_icon from '../assests/star_dull_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import { resolveImageUrl } from '../../config'
import { useNavigate } from 'react-router-dom'
// 1. IMPORT COMPONENT ĐÁNH GIÁ VÀO ĐÂY
import ProductReview from '../ProductReview/ProductReview'

const ProductDisplay = (props) => {
  const { product } = props
  const { addToCart } = useContext(ShopContext)

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
        // ignore parse errors and rely on the primary image
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
  const navigate = useNavigate()

  const sizeOptions = useMemo(() => ['S', 'M', 'L', 'XL', 'XXL'], [])

  useEffect(() => {
    setActiveImage(resolvedImages[0] || '')
  }, [resolvedImages])

  if (!product) {
    return null
  }

  // Khai báo biến kiểm tra Tồn kho
  const currentStock = Number(product.stock_quantity) || 0;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return; // Chặn thêm nếu hết hàng

    if (!selectedSize) {
      setSizeError('Vui lòng chọn kích thước trước khi thêm vào giỏ hàng.')
      return
    }

    // Kiểm tra không cho mua lố số lượng tồn kho
    if (quantity > currentStock) {
      setSizeError(`Rất tiếc, kho chỉ còn lại ${currentStock} sản phẩm.`);
      return;
    }

    setSizeError('')
    addToCart(product.id, selectedSize, quantity)
    setIsFeedbackModalOpen(true)
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const nextValue = Math.max(prev + delta, 1)
      // Không cho bấm tăng quá số lượng tồn
      if (nextValue > currentStock) return prev;
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

  const productImage = activeImage || resolvedImages[0] || resolveImageUrl(product?.image)

  return (
    <div className='product-page-container'>
      <div className='productdisplay'>
        <div className='productdisplay-left'>
          <div className='productdisplay-img-list'>
            {resolvedImages.map((img) => (
              <button
                key={img}
                type='button'
                className={img === activeImage ? 'productdisplay-thumbnail active' : 'productdisplay-thumbnail'}
                onClick={() => setActiveImage(img)}
              >
                <img src={img} alt='Hình sản phẩm' />
              </button>
            ))}
          </div>
          <div className='prodcutdisplay-img'>
            <img className='prodcutdisplay-main-img' src={activeImage} alt='' />
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
              {Number(product.old_price).toLocaleString()}đ
            </div>
            <div className='productdisplay-right-price-new'>
              {Number(product.new_price).toLocaleString()}đ
            </div>
          </div>

          {/* ====== CÁC THÔNG TIN CƠ BẢN VỪA BỔ SUNG ====== */}
          <div className='productdisplay-info-specs' style={{ margin: '15px 0', fontSize: '15px', color: '#475569', lineHeight: '1.8' }}>
            <div><strong>Mã SP:</strong> {product.code || 'Đang cập nhật'}</div>
            <div><strong>Danh mục:</strong> <span style={{ textTransform: 'capitalize' }}>{product.category}</span></div>
            <div><strong>Đơn vị tính:</strong> {product.unit || 'Cái'}</div>
            <div><strong>Tình trạng: </strong>
              {isOutOfStock ? (
                <span style={{ color: '#ef4444', fontWeight: 'bold', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>Hết hàng</span>
              ) : (
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Còn hàng ({currentStock} {product.unit})</span>
              )}
            </div>
          </div>

          {/* ====== MÔ TẢ SẢN PHẨM ====== */}
          <div className='productdisplay-right-description' style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Mô tả chi tiết:</h4>
            {product.description ? (
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{product.description}</p>
            ) : (
              <p style={{ margin: 0, fontStyle: 'italic', color: '#94a3b8' }}>Chưa có mô tả cho sản phẩm này.</p>
            )}
          </div>

          <div className='productdisplay-right-size'>
            <h1>Chọn kích thước</h1>
            <div className='productdisplay-right-sizes'>
              {sizeOptions.map((size) => (
                <button
                  type='button'
                  key={size}
                  disabled={isOutOfStock}
                  className={size === selectedSize ? 'productdisplay-size-option selected' : 'productdisplay-size-option'}
                  onClick={() => { setSelectedSize(size); setSizeError(''); }}
                  style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                >
                  {size}
                </button>
              ))}
            </div>
            {sizeError && <p className='productdisplay-size-error' style={{ color: 'red', marginTop: '10px' }}>{sizeError}</p>}
          </div>

          <div className='productdisplay-quantity'>
            <span>Số lượng</span>
            <div className='productdisplay-quantity-controls'>
              <button type='button' onClick={() => handleQuantityChange(-1)} disabled={isOutOfStock}>−</button>
              <span className='productdisplay-quantity-value'>{quantity}</span>
              <button type='button' onClick={() => handleQuantityChange(1)} disabled={isOutOfStock || quantity >= currentStock}>+</button>
            </div>
          </div>

          {/* ====== NÚT THÊM VÀO GIỎ ====== */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            style={{
              background: isOutOfStock ? '#94a3b8' : '#ff4141',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              opacity: isOutOfStock ? 0.7 : 1
            }}
          >
            {isOutOfStock ? 'TẠM HẾT HÀNG' : 'THÊM VÀO GIỎ'}
          </button>
        </div>

        {isFeedbackModalOpen && (
          <div className='productdisplay-feedback-backdrop'>
            <div className='productdisplay-feedback-modal' role='alertdialog' aria-modal='true'>
              <button type='button' className='productdisplay-feedback-close' onClick={handleCloseFeedbackModal}>×</button>
              <div className='productdisplay-feedback-icon'>✓</div>
              <h2>Thêm vào giỏ hàng thành công</h2>
              <div className='productdisplay-feedback-product-info'>
                <img className='productdisplay-feedback-product-image' src={productImage} alt={product.name} />
                <div className='productdisplay-feedback-product-details'>
                  <p className='productdisplay-feedback-product'>{product.name}</p>
                  {selectedSize && <p className='productdisplay-feedback-size'>Kích thước: {selectedSize}</p>}
                  <p className='productdisplay-feedback-quantity'>Số lượng: {quantity}</p>
                </div>
              </div>
              <div className='productdisplay-feedback-actions'>
                <button type='button' className='continue' onClick={handleContinueShopping}>Tiếp tục mua sắm</button>
                <button type='button' className='view-cart' onClick={handleViewCart}>Xem giỏ hàng</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="product-review-wrapper" style={{ marginTop: '50px', padding: '0 20px' }}>
        <ProductReview productId={product.id} />
      </div>

    </div>
  )
}

export default ProductDisplay