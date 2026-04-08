import React, { useState } from 'react'
import './AddProduct.css'
import upload_area from '../../assets/upload_area.svg'
import { addProduct, uploadProductImage } from '../../services/productService'

const initialState = {
  code: '',
  name: '',
  category: 'women',
  unit: 'Cai',
  initial_stock: '',
  import_price: '',
  profit_margin: '',
  old_price: '',
  status: 'active',
  description: ''
}

const AddProduct = () => {
  const [images, setImages] = useState([])
  const [productDetails, setProductDetails] = useState(initialState)

  const imageHandler = (event) => {
    const files = Array.from(event.target.files || [])
    setImages(files)
  }

  const changeHandler = (event) => {
    setProductDetails((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleAddProduct = async () => {
    if (!images.length) {
      alert('Vui long chon it nhat mot anh san pham.')
      return
    }

    if (!productDetails.code || !productDetails.name) {
      alert('Vui long nhap ma va ten san pham.')
      return
    }

    try {
      const uploadedUrls = []

      for (const file of images) {
        const uploadData = await uploadProductImage(file)
        uploadedUrls.push(uploadData.image_url)
      }

      await addProduct({
        ...productDetails,
        images: uploadedUrls,
        image: uploadedUrls[0]
      })

      alert('Da them san pham thanh cong!')
      setProductDetails(initialState)
      setImages([])
    } catch (error) {
      console.error('Add product failed:', error)
      alert(error.message || 'Khong the them san pham.')
    }
  }

  return (
    <div className='add-product'>
      <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Them san pham moi</h2>

      <div className='addproduct-grid'>
        <div className='addproduct-itemfield'>
          <p>Ma san pham (*)</p>
          <input value={productDetails.code} onChange={changeHandler} type='text' name='code' placeholder='VD: SP001' />
        </div>

        <div className='addproduct-itemfield'>
          <p>Ten san pham (*)</p>
          <input value={productDetails.name} onChange={changeHandler} type='text' name='name' placeholder='Nhap ten san pham' />
        </div>

        <div className='addproduct-itemfield'>
          <p>Danh muc</p>
          <select value={productDetails.category} onChange={changeHandler} name='category' className='add-product-selector'>
            <option value='women'>Phu nu</option>
            <option value='men'>Dan ong</option>
            <option value='kid'>Tre em</option>
          </select>
        </div>

        <div className='addproduct-itemfield'>
          <p>Don vi tinh</p>
          <select value={productDetails.unit} onChange={changeHandler} name='unit' className='add-product-selector'>
            <option value='Cai'>Cai</option>
            <option value='Bo'>Bo</option>
            <option value='Chiec'>Chiec</option>
            <option value='Doi'>Doi</option>
          </select>
        </div>

        <div className='addproduct-itemfield'>
          <p>So luong ban dau</p>
          <input value={productDetails.initial_stock} onChange={changeHandler} type='number' name='initial_stock' placeholder='0' min='0' />
        </div>

        <div className='addproduct-itemfield'>
          <p>Gia nhap ban dau (VND)</p>
          <input value={productDetails.import_price} onChange={changeHandler} type='number' name='import_price' placeholder='0' min='0' />
        </div>

        <div className='addproduct-itemfield'>
          <p>Ty le loi nhuan (%)</p>
          <input value={productDetails.profit_margin} onChange={changeHandler} type='number' name='profit_margin' placeholder='VD: 30' min='0' />
        </div>

        <div className='addproduct-itemfield'>
          <p>Gia cu</p>
          <input value={productDetails.old_price} onChange={changeHandler} type='number' name='old_price' placeholder='0' min='0' />
        </div>

        <div className='addproduct-itemfield'>
          <p>Trang thai</p>
          <select value={productDetails.status} onChange={changeHandler} name='status' className='add-product-selector' style={{ fontWeight: 'bold', color: productDetails.status === 'active' ? '#10b981' : '#ef4444' }}>
            <option value='active'>Hien thi</option>
            <option value='hidden'>An</option>
          </select>
        </div>
      </div>

      <div className='addproduct-itemfield' style={{ marginTop: '15px' }}>
        <p>Mo ta san pham</p>
        <textarea
          value={productDetails.description}
          onChange={changeHandler}
          name='description'
          placeholder='Nhap mo ta chi tiet san pham...'
          rows='4'
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
        />
      </div>

      <div className='addproduct-itemfield' style={{ marginTop: '15px' }}>
        <p>Hinh anh san pham (*)</p>
        <label htmlFor='file-input'>
          <div className='addproduct-thumnail-img'>
            {images.length ? (
              <div className='addproduct-image-preview'>
                {images.map((file, index) => (
                  <img key={file.name + index} src={URL.createObjectURL(file)} alt='Preview' style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginRight: '10px' }} />
                ))}
              </div>
            ) : (
              <img src={upload_area} alt='Upload placeholder' />
            )}
          </div>
        </label>
        <input onChange={imageHandler} type='file' multiple name='image' id='file-input' hidden />
      </div>

      <button onClick={handleAddProduct} className='addproduct-btn'>
        THEM SAN PHAM
      </button>
    </div>
  )
}

export default AddProduct
