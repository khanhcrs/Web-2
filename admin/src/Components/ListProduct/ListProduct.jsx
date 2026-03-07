import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';
import upload_area from '../../assets/upload_area.svg';
import { API_BASE_URL, resolveImageUrl } from '../../config';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // STATE CHO CHỈNH SỬA
  const [editProduct, setEditProduct] = useState(null);
  const [existingImages, setExistingImages] = useState([]); // Ảnh cũ từ DB
  const [newImages, setNewImages] = useState([]); // Ảnh mới up lên
  const [saving, setSaving] = useState(false);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/allproducts`);
      const data = await response.json();
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInfo(); }, []);

  const removeProduct = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/removeproduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.action === 'hidden' ? "Sản phẩm đã từng nhập kho nên được chuyển sang trạng thái ẨN." : "Đã xóa vĩnh viễn sản phẩm.");
        fetchInfo();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- MỞ FORM SỬA ---
  const startEdit = (product) => {
    setEditProduct({ ...product });
    // Lấy mảng ảnh cũ (nếu mảng rỗng thì lấy ảnh chính)
    let imgs = product.images || [];
    if (imgs.length === 0 && product.image) imgs = [product.image];
    setExistingImages(imgs);
    setNewImages([]);
  };

  const updateEditField = (field, value) => {
    setEditProduct((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // --- XỬ LÝ HÌNH ẢNH TRONG FORM SỬA ---
  const handleNewImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setNewImages([...newImages, ...files]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  // --- LƯU CẬP NHẬT ---
  const submitUpdate = async () => {
    if (!editProduct) return;
    setSaving(true);
    try {
      let finalImages = [...existingImages];

      // 1. Nếu có ảnh mới, phải upload lên server trước
      for (const file of newImages) {
        const formData = new FormData();
        formData.append('product', file);
        const uploadResp = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
        const uploadData = await uploadResp.json();
        if (uploadData.success) {
          finalImages.push(uploadData.image_url);
        }
      }

      if (finalImages.length === 0) {
        alert("Sản phẩm phải có ít nhất 1 hình ảnh!");
        setSaving(false); return;
      }

      // 2. Gửi API Cập nhật thông tin
      const payload = {
        code: editProduct.code,
        name: editProduct.name,
        category: editProduct.category,
        unit: editProduct.unit,
        profit_margin: editProduct.profit_margin,
        old_price: editProduct.old_price,
        status: editProduct.status,
        description: editProduct.description,
        images: finalImages
      };

      const response = await fetch(`${API_BASE_URL}/product/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        alert('Cập nhật sản phẩm thành công!');
        setEditProduct(null);
        fetchInfo();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (err) {
      alert("Không thể cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='list-product'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Danh sách sản phẩm</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Tổng: {allProducts.length} sản phẩm</p>
      </div>

      <div className='listproduct-format-main'>
        <p>Hình ảnh</p>
        <p>Mã SP</p>
        <p>Tên sản phẩm</p>
        <p>Hiện trạng</p>
        <p>Giá lẻ</p>
        <p>Hành động</p>
      </div>

      <div className='listproduct-allproducts'>
        <hr />
        {allProducts.map((product) => (
          <React.Fragment key={product.id}>
            <div className='listproduct-format-main listproduct-format'>
              <img src={resolveImageUrl(product.image)} alt='' className='listproduct-product-icon' />
              <p style={{ fontWeight: 'bold', color: '#475569' }}>{product.code || 'N/A'}</p>
              <p>{product.name}</p>
              <p>
                <span className={`status-badge ${product.status}`}>
                  {product.status === 'active' ? 'Hiển thị' : 'Đang ẩn'}
                </span>
              </p>
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>{Number(product.new_price || 0).toLocaleString()}đ</p>
              <div className='listproduct-actions'>
                <button className="btn-edit-product" onClick={() => startEdit(product)}>Sửa</button>
                <img onClick={() => removeProduct(product.id)} className='listproduct-remove-icon' src={cross_icon} alt='Xoá' title="Xóa sản phẩm" />
              </div>
            </div>
            <hr />
          </React.Fragment>
        ))}
      </div>

      {/* ====== MODAL SỬA SẢN PHẨM ====== */}
      {editProduct && (
        <div className='listproduct-edit-modal'>
          <div className='listproduct-edit-card'>
            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Sửa thông tin sản phẩm</h3>

            <div className='listproduct-edit-grid'>
              <label>Mã Sản Phẩm
                <input type='text' value={editProduct.code || ''} onChange={(e) => updateEditField('code', e.target.value)} />
              </label>

              <label>Tên Sản Phẩm
                <input type='text' value={editProduct.name || ''} onChange={(e) => updateEditField('name', e.target.value)} />
              </label>

              <label>Hiện Trạng (Bán/Ẩn)
                <select value={editProduct.status || 'active'} onChange={(e) => updateEditField('status', e.target.value)} style={{ color: editProduct.status === 'active' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  <option value="active">Hiển thị (Đang bán)</option>
                  <option value="hidden">Ẩn (Ngừng bán)</option>
                </select>
              </label>

              <label>Danh mục
                <select value={editProduct.category || 'women'} onChange={(e) => updateEditField('category', e.target.value)}>
                  <option value="women">Phụ Nữ</option>
                  <option value="men">Đàn Ông</option>
                  <option value="kid">Trẻ Em</option>
                </select>
              </label>

              <label>Tỉ Lệ Lợi Nhuận (%)
                <input type='number' value={editProduct.profit_margin || 0} onChange={(e) => updateEditField('profit_margin', e.target.value)} />
              </label>

              <label>Giá Cũ (Gạch bỏ)
                <input type='number' value={editProduct.old_price || 0} onChange={(e) => updateEditField('old_price', e.target.value)} />
              </label>
            </div>

            <label style={{ display: 'block', marginTop: '15px' }}>Mô Tả Sản Phẩm
              <textarea value={editProduct.description || ''} onChange={(e) => updateEditField('description', e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px' }} />
            </label>

            {/* PHẦN CHỈNH SỬA HÌNH ẢNH */}
            <div className="image-edit-section" style={{ marginTop: '20px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>Quản Lý Hình Ảnh (Xóa & Thêm)</p>
              <div className="image-preview-container">
                {/* Ảnh cũ */}
                {existingImages.map((imgUrl, idx) => (
                  <div key={`old-${idx}`} className="image-wrapper">
                    <img src={resolveImageUrl(imgUrl)} alt="Cũ" />
                    <span className="remove-img-btn" onClick={() => removeExistingImage(idx)}>✕</span>
                  </div>
                ))}

                {/* Ảnh mới vừa chọn */}
                {newImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="image-wrapper new-badge">
                    <img src={URL.createObjectURL(file)} alt="Mới" />
                    <span className="remove-img-btn" onClick={() => removeNewImage(idx)}>✕</span>
                  </div>
                ))}

                {/* Nút upload */}
                <label className="upload-more-btn">
                  <img src={upload_area} alt="Upload" />
                  <input type="file" multiple hidden onChange={handleNewImageUpload} />
                </label>
              </div>
            </div>

            <div className='listproduct-edit-actions'>
              <button type='button' className='btn-cancel-modal' onClick={() => setEditProduct(null)} disabled={saving}>Huỷ</button>
              <button type='button' className='btn-save-modal' onClick={submitUpdate} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProduct;