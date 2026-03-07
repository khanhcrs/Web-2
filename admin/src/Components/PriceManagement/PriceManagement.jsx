import React, { useState, useEffect } from 'react';
import './PriceManagement.css';

const PriceManagement = () => {
    const [products, setProducts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [tempMargin, setTempMargin] = useState('');

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:4000/allproducts');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Lỗi tải danh sách sản phẩm:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Bật chế độ sửa cho 1 dòng
    const handleEditClick = (product) => {
        setEditingId(product.id);
        setTempMargin(product.profit_margin || 0);
    };

    // Hủy sửa
    const handleCancelClick = () => {
        setEditingId(null);
        setTempMargin('');
    };

    // Gửi API lưu Tỉ lệ lợi nhuận mới
    const handleSaveMargin = async (productId) => {
        try {
            const res = await fetch('http://localhost:4000/update-profit-margin', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: productId, newProfitMargin: tempMargin })
            });
            const data = await res.json();

            if (data.success) {
                alert('Đã cập nhật tỷ lệ lợi nhuận và giá bán thành công!');
                setEditingId(null);
                fetchProducts(); // Tải lại bảng để thấy giá bán mới tự nhảy
            } else {
                alert('Lỗi cập nhật: ' + data.message);
            }
        } catch (error) {
            console.error('Lỗi kết nối:', error);
            alert('Không thể kết nối đến máy chủ.');
        }
    };

    return (
        <div className="price-mgmt-container">
            <h2 className="price-mgmt-title">Quản lý Giá Bán & Lợi Nhuận</h2>
            <p className="price-mgmt-subtitle">Điều chỉnh tỷ lệ % lợi nhuận mong muốn. Giá bán sẽ tự động tính dựa trên Giá nhập bình quân.</p>

            <div className="price-card">
                <div className="price-table-wrapper">
                    <table className="price-table">
                        <thead>
                            <tr>
                                <th>Mã SP</th>
                                <th>Tên Sản Phẩm</th>
                                <th>Tồn Kho</th>
                                <th>Giá Nhập (Vốn)</th>
                                <th>Lợi Nhuận (%)</th>
                                <th>Giá Bán Lẻ</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.code || `SP${p.id}`}</td>
                                    <td style={{ fontWeight: '500' }}>{p.name}</td>
                                    <td>{p.stock_quantity || 0}</td>
                                    <td style={{ color: '#64748b' }}>
                                        {Number(p.current_import_price || 0).toLocaleString()} ₫
                                    </td>

                                    {/* CỘT TỈ LỆ LỢI NHUẬN (CHO PHÉP SỬA) */}
                                    <td>
                                        {editingId === p.id ? (
                                            <div className="edit-margin-box">
                                                <input
                                                    type="number"
                                                    value={tempMargin}
                                                    onChange={(e) => setTempMargin(e.target.value)}
                                                    min="0"
                                                    className="margin-input"
                                                />
                                                <span className="percent-icon">%</span>
                                            </div>
                                        ) : (
                                            <span className="margin-badge">
                                                {p.profit_margin || 0}%
                                            </span>
                                        )}
                                    </td>

                                    <td style={{ fontWeight: '700', color: '#10b981' }}>
                                        {Number(p.new_price || 0).toLocaleString()} ₫
                                    </td>

                                    {/* NÚT THAO TÁC */}
                                    <td>
                                        {editingId === p.id ? (
                                            <div className="action-buttons">
                                                <button className="btn-save" onClick={() => handleSaveMargin(p.id)}>Lưu</button>
                                                <button className="btn-cancel" onClick={handleCancelClick}>Hủy</button>
                                            </div>
                                        ) : (
                                            <button className="btn-edit" onClick={() => handleEditClick(p)}>Cập nhật %</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PriceManagement;