import React, { useEffect, useState } from 'react'
import './ListProduct.css'
import cross_icon from '../../assets/cross_icon.png'
import upload_area from '../../assets/upload_area.svg'
import { resolveImageUrl } from '../../config'
import { listProducts, removeProduct, updateProduct, uploadProductImage } from '../../services/productService'

const normalizeProductImages = (value, fallbackImage = '') => {
  let images = []

  if (Array.isArray(value)) {
    images = value
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      images = Array.isArray(parsed) ? parsed : [value]
    } catch (error) {
      images = [value]
    }
  }

  const normalized = images
    .filter((image) => typeof image === 'string')
    .map((image) => image.trim())
    .filter(Boolean)

  if (normalized.length === 0 && fallbackImage) {
    return [fallbackImage]
  }

  return normalized
}

const normalizeProduct = (product) => ({
  ...product,
  images: normalizeProductImages(product.images, product.image)
})

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [saving, setSaving] = useState(false)

  const fetchInfo = async () => {
    setLoading(true)

    try {
      const data = await listProducts()
      setAllProducts(data.map(normalizeProduct))
    } catch (error) {
      console.error(error)
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [])

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Ban co chac chan muon xu ly san pham nay?')) {
      return
    }

    try {
      const data = await removeProduct(productId)
      alert(
        data.action === 'hidden'
          ? 'San pham da co lich su nen duoc chuyen sang trang thai an.'
          : 'Da xoa vinh vien san pham.'
      )
      fetchInfo()
    } catch (error) {
      alert(error.message || 'Khong the xoa san pham.')
    }
  }

  const startEdit = (product) => {
    const normalizedProduct = normalizeProduct(product)
    setEditProduct(normalizedProduct)
    setExistingImages(normalizedProduct.images)
    setNewImages([])
  }

  const updateEditField = (field, value) => {
    setEditProduct((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleNewImageUpload = (event) => {
    const files = Array.from(event.target.files || [])
    setNewImages((prev) => [...prev, ...files])
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const submitUpdate = async () => {
    if (!editProduct) {
      return
    }

    setSaving(true)

    try {
      let finalImages = [...existingImages]

      for (const file of newImages) {
        const uploadData = await uploadProductImage(file)
        finalImages.push(uploadData.image_url)
      }

      finalImages = Array.from(new Set(finalImages.filter(Boolean)))

      if (finalImages.length === 0) {
        throw new Error('San pham phai co it nhat 1 hinh anh.')
      }

      await updateProduct(editProduct.id, {
        code: editProduct.code || '',
        name: editProduct.name || '',
        category: editProduct.category || 'women',
        unit: editProduct.unit || 'Cai',
        profit_margin: editProduct.profit_margin ?? 0,
        old_price: editProduct.old_price ?? 0,
        status: editProduct.status || 'active',
        description: editProduct.description || '',
        images: finalImages
      })

      alert('Cap nhat san pham thanh cong!')
      setEditProduct(null)
      fetchInfo()
    } catch (error) {
      alert(error.message || 'Khong the cap nhat san pham.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='list-product'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Danh sach san pham</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Tong: {allProducts.length} san pham
        </p>
      </div>

      <div className='listproduct-format-main'>
        <p>Hinh anh</p>
        <p>Ma SP</p>
        <p>Ten san pham</p>
        <p>Hien trang</p>
        <p>Gia le</p>
        <p>Hanh dong</p>
      </div>

      <div className='listproduct-allproducts'>
        <hr />
        {loading && <p>Dang tai du lieu...</p>}

        {!loading && allProducts.map((product) => (
          <React.Fragment key={product.id}>
            <div className='listproduct-format-main listproduct-format'>
              <img
                src={resolveImageUrl(product.image)}
                alt={product.name}
                className='listproduct-product-icon'
              />
              <p style={{ fontWeight: 'bold', color: '#475569' }}>{product.code || 'N/A'}</p>
              <p>{product.name}</p>
              <p>
                <span className={`status-badge ${product.status}`}>
                  {product.status === 'active' ? 'Hien thi' : 'Dang an'}
                </span>
              </p>
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                {Number(product.new_price || 0).toLocaleString()}d
              </p>
              <div className='listproduct-actions'>
                <button className='btn-edit-product' onClick={() => startEdit(product)}>
                  Sua
                </button>
                <img
                  onClick={() => handleRemoveProduct(product.id)}
                  className='listproduct-remove-icon'
                  src={cross_icon}
                  alt='Xoa'
                  title='Xoa san pham'
                />
              </div>
            </div>
            <hr />
          </React.Fragment>
        ))}
      </div>

      {editProduct && (
        <div className='listproduct-edit-modal'>
          <div className='listproduct-edit-card'>
            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Sua thong tin san pham</h3>

            <div className='listproduct-edit-grid'>
              <label>
                Ma san pham
                <input
                  type='text'
                  value={editProduct.code || ''}
                  onChange={(event) => updateEditField('code', event.target.value)}
                />
              </label>

              <label>
                Ten san pham
                <input
                  type='text'
                  value={editProduct.name || ''}
                  onChange={(event) => updateEditField('name', event.target.value)}
                />
              </label>

              <label>
                Hien trang
                <select
                  value={editProduct.status || 'active'}
                  onChange={(event) => updateEditField('status', event.target.value)}
                  style={{
                    color: editProduct.status === 'active' ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}
                >
                  <option value='active'>Hien thi</option>
                  <option value='hidden'>An</option>
                </select>
              </label>

              <label>
                Danh muc
                <select
                  value={editProduct.category || 'women'}
                  onChange={(event) => updateEditField('category', event.target.value)}
                >
                  <option value='women'>Phu nu</option>
                  <option value='men'>Dan ong</option>
                  <option value='kid'>Tre em</option>
                </select>
              </label>

              <label>
                Ti le loi nhuan (%)
                <input
                  type='number'
                  value={editProduct.profit_margin || 0}
                  onChange={(event) => updateEditField('profit_margin', event.target.value)}
                />
              </label>

              <label>
                Gia cu
                <input
                  type='number'
                  value={editProduct.old_price || 0}
                  onChange={(event) => updateEditField('old_price', event.target.value)}
                />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '15px' }}>
              Mo ta san pham
              <textarea
                value={editProduct.description || ''}
                onChange={(event) => updateEditField('description', event.target.value)}
                rows='3'
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  marginTop: '5px'
                }}
              />
            </label>

            <div className='image-edit-section' style={{ marginTop: '20px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
                Quan ly hinh anh
              </p>
              <div className='image-preview-container'>
                {existingImages.map((imgUrl, index) => (
                  <div key={`old-${index}`} className='image-wrapper'>
                    <img src={resolveImageUrl(imgUrl)} alt='Cu' />
                    <span className='remove-img-btn' onClick={() => removeExistingImage(index)}>
                      x
                    </span>
                  </div>
                ))}

                {newImages.map((file, index) => (
                  <div key={`new-${index}`} className='image-wrapper new-badge'>
                    <img src={URL.createObjectURL(file)} alt='Moi' />
                    <span className='remove-img-btn' onClick={() => removeNewImage(index)}>
                      x
                    </span>
                  </div>
                ))}

                <label className='upload-more-btn'>
                  <img src={upload_area} alt='Upload' />
                  <input type='file' multiple hidden onChange={handleNewImageUpload} />
                </label>
              </div>
            </div>

            <div className='listproduct-edit-actions'>
              <button
                type='button'
                className='btn-cancel-modal'
                onClick={() => setEditProduct(null)}
                disabled={saving}
              >
                Huy
              </button>
              <button
                type='button'
                className='btn-save-modal'
                onClick={submitUpdate}
                disabled={saving}
              >
                {saving ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListProduct
