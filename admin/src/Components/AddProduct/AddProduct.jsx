import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';
import { API_BASE_URL } from '../../config';

const AddProduct = () => {
  const [images, setImages] = useState([]);
  const [productDetails, setProductDetails] = useState({
    code: '',
    name: '',
    category: 'women',
    unit: 'Cái',
    initial_stock: '',
    import_price: '',
    profit_margin: '',
    old_price: '',
    status: 'active',
    description: ''
  });

  const imageHandler = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  const Add_Product = async () => {
    if (!images.length) {
      alert('Vui lòng chọn ít nhất một ảnh sản phẩm.');
      return;
    }
    if (!productDetails.code || !productDetails.name) {
      alert('Vui lòng nhập Mã và Tên sản phẩm.');
      return;
    }

    try {
      const uploadedUrls = [];

      for (const file of images) {
        const formData = new FormData();
        formData.append('product', file);

        const uploadResp = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        });

        const uploadData = await uploadResp.json();
        if (!uploadData.success) throw new Error('Upload failed');
        uploadedUrls.push(uploadData.image_url);
      }

      const product = {
        ...productDetails,
        images: uploadedUrls,
        image: uploadedUrls[0],
      };

      const response = await fetch(`${API_BASE_URL}/addproduct`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Đã thêm sản phẩm thành công!');
        // Reset form
        setProductDetails({
          code: '', name: '', category: 'women', unit: 'Cái', initial_stock: '', import_price: '', profit_margin: '', old_price: '', status: 'active', description: ''
        });
        setImages([]);
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (error) {
      console.error('Add product failed:', error);
      alert('❌ Không thể thêm sản phẩm. Vui lòng kiểm tra lại server.');
    }
  };

  return (
    <div className="add-product">
      <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Thêm Sản Phẩm Mới</h2>

      <div className="addproduct-grid">
        <div className="addproduct-itemfield">
          <p>Mã Sản Phẩm (*)</p>
          <input value={productDetails.code} onChange={changeHandler} type="text" name="code" placeholder="VD: SP001" />
        </div>

        <div className="addproduct-itemfield">
          <p>Tên Sản Phẩm (*)</p>
          <input value={productDetails.name} onChange={changeHandler} type="text" name="name" placeholder="Nhập tên sản phẩm" />
        </div>

        <div className="addproduct-itemfield">
          <p>Danh Mục</p>
          <select value={productDetails.category} onChange={changeHandler} name="category" className="add-product-selector">
            <option value="women">Phụ Nữ</option>
            <option value="men">Đàn Ông</option>
            <option value="kid">Trẻ Em</option>
          </select>
        </div>

        <div className="addproduct-itemfield">
          <p>Đơn Vị Tính</p>
          <select value={productDetails.unit} onChange={changeHandler} name="unit" className="add-product-selector">
            <option value="Cái">Cái</option>
            <option value="Bộ">Bộ</option>
            <option value="Chiếc">Chiếc</option>
            <option value="Đôi">Đôi</option>
          </select>
        </div>

        <div className="addproduct-itemfield">
          <p>Số Lượng Ban Đầu</p>
          <input value={productDetails.initial_stock} onChange={changeHandler} type="number" name="initial_stock" placeholder="0" min="0" />
        </div>

        <div className="addproduct-itemfield">
          <p>Giá Nhập Ban Đầu (₫)</p>
          <input value={productDetails.import_price} onChange={changeHandler} type="number" name="import_price" placeholder="0" min="0" />
        </div>

        <div className="addproduct-itemfield">
          <p>Tỉ Lệ Lợi Nhuận (%)</p>
          <input value={productDetails.profit_margin} onChange={changeHandler} type="number" name="profit_margin" placeholder="VD: 30" min="0" />
        </div>

        <div className="addproduct-itemfield">
          <p>Giá Cũ (Gạch bỏ trên web)</p>
          <input value={productDetails.old_price} onChange={changeHandler} type="number" name="old_price" placeholder="0" min="0" />
        </div>

        <div className="addproduct-itemfield">
          <p>Trạng Thái</p>
          <select value={productDetails.status} onChange={changeHandler} name="status" className="add-product-selector" style={{ fontWeight: 'bold', color: productDetails.status === 'active' ? '#10b981' : '#ef4444' }}>
            <option value="active">Hiển thị (Đang bán)</option>
            <option value="hidden">Ẩn (Không bán)</option>
          </select>
        </div>
      </div>

      <div className="addproduct-itemfield" style={{ marginTop: '15px' }}>
        <p>Mô Tả Sản Phẩm</p>
        <textarea
          value={productDetails.description}
          onChange={changeHandler}
          name="description"
          placeholder="Nhập mô tả chi tiết sản phẩm..."
          rows="4"
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit' }}
        />
      </div>

      <div className="addproduct-itemfield" style={{ marginTop: '15px' }}>
        <p>Hình Ảnh Sản Phẩm (*)</p>
        <label htmlFor="file-input">
          <div className="addproduct-thumnail-img">
            {images.length ? (
              <div className="addproduct-image-preview">
                {images.map((file, index) => (
                  <img key={file.name + index} src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginRight: '10px' }} />
                ))}
              </div>
            ) : (
              <img src={upload_area} alt="Upload placeholder" />
            )}
          </div>
        </label>
        <input onChange={imageHandler} type="file" multiple name="image" id="file-input" hidden />
      </div>

      <button onClick={Add_Product} className="addproduct-btn">
        THÊM SẢN PHẨM
      </button>
    </div>
  );
};

export default AddProduct;