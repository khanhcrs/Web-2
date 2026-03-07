import React, { useState, useEffect } from 'react';
import './AddImportReceipt.css';

const AddImportReceipt = () => {
    // 1. STATE CHO TÌM KIẾM VÀ DANH SÁCH
    const [receiptsList, setReceiptsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // 2. STATE CHO FORM NHẬP LIỆU
    const [products, setProducts] = useState([]);
    const [receiptCode, setReceiptCode] = useState(`PN${Date.now()}`);
    const [details, setDetails] = useState([]);
    const [editingReceiptId, setEditingReceiptId] = useState(null); // Lưu ID của phiếu đang sửa

    // 3. STATE CHO Ô NHẬP TẠM
    const [selectedProductId, setSelectedProductId] = useState('');
    const [importPrice, setImportPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    // --- TẢI DỮ LIỆU KHI VÀO TRANG ---
    useEffect(() => {
        fetchProducts();
        fetchAllReceipts();
    }, []);

    const fetchProducts = async () => {
        const res = await fetch('http://localhost:4000/allproducts');
        setProducts(await res.json());
    };

    const fetchAllReceipts = async () => {
        const res = await fetch('http://localhost:4000/import-receipts');
        const data = await res.json();
        if (data.success) setReceiptsList(data.receipts);
    };

    // --- CHỨC NĂNG TÌM KIẾM ---
    const filteredReceipts = receiptsList.filter(r =>
        r.receipt_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- CHỨC NĂNG: BẤM NÚT "SỬA PHIẾU" ---
    const handleEditReceipt = async (id) => {
        try {
            const res = await fetch(`http://localhost:4000/import-receipts/${id}`);
            const data = await res.json();

            if (data.success) {
                setEditingReceiptId(data.receipt.id);
                setReceiptCode(data.receipt.receipt_code);

                // Đổ danh sách sản phẩm cũ vào Form
                const loadedDetails = data.details.map(d => ({
                    productId: d.product_id,
                    name: d.name,
                    importPrice: Number(d.import_price),
                    quantity: Number(d.quantity),
                    total: Number(d.import_price) * Number(d.quantity)
                }));
                setDetails(loadedDetails);

                // Tự động cuộn trang xuống chỗ Form sửa
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        } catch (error) {
            alert('Lỗi khi lấy thông tin phiếu nhập!');
        }
    };

    // --- CHỨC NĂNG: HỦY SỬA (QUAY VỀ TẠO MỚI) ---
    const handleCancelEdit = () => {
        setEditingReceiptId(null);
        setReceiptCode(`PN${Date.now()}`);
        setDetails([]);
    };

    // --- THÊM / XÓA SẢN PHẨM VÀO FORM (CHƯA LƯU DB) ---
    const handleAddDetail = () => {
        if (!selectedProductId || !importPrice || !quantity) return alert('Vui lòng nhập đủ Giá nhập, Số lượng!');

        const product = products.find(p => p.id === Number(selectedProductId));
        if (details.findIndex(d => d.productId === product.id) >= 0) return alert('Sản phẩm này đã có, vui lòng xóa dòng cũ để nhập lại!');

        const newDetail = {
            productId: product.id,
            name: product.name,
            importPrice: Number(importPrice),
            quantity: Number(quantity),
            total: Number(importPrice) * Number(quantity)
        };

        setDetails([...details, newDetail]);
        setSelectedProductId(''); setImportPrice(''); setQuantity('');
    };

    const handleRemoveDetail = (index) => {
        const newDetails = [...details];
        newDetails.splice(index, 1);
        setDetails(newDetails);
    };

    // --- NÚT CHỐT: LƯU NHÁP (SỬA) HOẶC HOÀN THÀNH ---
    const handleSaveReceipt = async (isComplete) => {
        if (details.length === 0) return alert('Vui lòng thêm ít nhất 1 sản phẩm!');

        try {
            let currentReceiptId = editingReceiptId;

            // BƯỚC 1: LƯU THÔNG TIN PHIẾU (TẠO MỚI HOẶC CẬP NHẬT)
            if (editingReceiptId) {
                // Nếu đang Sửa -> Gọi API Cập nhật (PUT)
                const res = await fetch(`http://localhost:4000/import-receipts/${editingReceiptId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ receiptCode, details })
                });
                const data = await res.json();
                if (!data.success) return alert(data.message);
            } else {
                // Nếu Tạo mới -> Gọi API Tạo (POST)
                const res = await fetch('http://localhost:4000/import-receipts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ receiptCode, details })
                });
                const data = await res.json();
                if (!data.success) return alert(data.message);
                currentReceiptId = data.receipt.id; // Lấy ID vừa tạo
            }

            // BƯỚC 2: NẾU BẤM "HOÀN THÀNH", GỌI API CHỐT KHO & TÍNH GIÁ
            if (isComplete) {
                const completeRes = await fetch(`http://localhost:4000/import-receipts/${currentReceiptId}/complete`, {
                    method: 'POST'
                });
                const completeData = await completeRes.json();

                if (completeData.success) {
                    alert('✅ HOÀN THÀNH PHIẾU THÀNH CÔNG! Kho và Giá vốn đã được tự động tính lại.');
                } else {
                    return alert('❌ Lỗi chốt kho: ' + completeData.message);
                }
            } else {
                alert('📝 Đã LƯU NHÁP phiếu nhập thành công!');
            }

            // Làm sạch Form và tải lại bảng
            handleCancelEdit();
            fetchAllReceipts();
        } catch (error) {
            alert('Không thể kết nối đến Server!');
        }
    };

    const grandTotal = details.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="add-receipt-container">
            <h2 style={{ color: '#0f172a', marginBottom: '5px' }}>Quản Lý Nhập Kho</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                Tìm kiếm, sửa phiếu nháp hoặc lập phiếu nhập hàng mới.
            </p>

            {/* ====== PHẦN 1: TÌM KIẾM VÀ DANH SÁCH PHIẾU ====== */}
            <div className="receipt-form-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0 }}>Lịch sử Phiếu Nhập</h4>
                    <input
                        type="text"
                        placeholder="🔍 Tìm theo Mã phiếu (VD: PN001)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 15px', width: '250px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <table className="receipt-table" style={{ marginBottom: 0 }}>
                    <thead>
                        <tr>
                            <th>Mã Phiếu</th>
                            <th>Ngày Lập</th>
                            <th>Trạng Thái</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReceipts.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không tìm thấy phiếu nào</td></tr>
                        ) : (
                            filteredReceipts.map(r => (
                                <tr key={r.id} style={{ backgroundColor: editingReceiptId === r.id ? '#eff6ff' : 'white' }}>
                                    <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{r.receipt_code}</td>
                                    <td>{new Date(r.created_at).toLocaleString('vi-VN')}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                            backgroundColor: r.status === 'completed' ? '#dcfce7' : '#fef9c3',
                                            color: r.status === 'completed' ? '#16a34a' : '#ca8a04'
                                        }}>
                                            {r.status === 'completed' ? 'Đã chốt kho' : 'Lưu nháp'}
                                        </span>
                                    </td>
                                    <td>
                                        {/* ĐÂY CHÍNH LÀ LOGIC: CHỈ HIỆN NÚT SỬA KHI CHƯA HOÀN THÀNH */}
                                        {r.status === 'pending' ? (
                                            <button
                                                onClick={() => handleEditReceipt(r.id)}
                                                style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                ✏️ Sửa phiếu
                                            </button>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>🔒 Đã khóa</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ====== PHẦN 2: FORM LẬP / SỬA PHIẾU ====== */}
            <div className="receipt-form-box" style={{ border: editingReceiptId ? '2px solid #3b82f6' : '1px dashed #007bff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: editingReceiptId ? '#3b82f6' : '#333' }}>
                        {editingReceiptId ? `ĐANG SỬA: ${receiptCode}` : 'LẬP PHIẾU MỚI'}
                    </h4>
                    {editingReceiptId && (
                        <button onClick={handleCancelEdit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                            ✕ Hủy Sửa / Tạo Mới
                        </button>
                    )}
                </div>

                <div className="receipt-header" style={{ marginTop: '15px' }}>
                    <label>Mã Phiếu Nhập: </label>
                    <input type="text" value={receiptCode} onChange={(e) => setReceiptCode(e.target.value)} />
                </div>

                <div className="receipt-inputs">
                    <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                        <option value="" disabled>-- Chọn sản phẩm cần nhập --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.code ? `[${p.code}]` : ''} {p.name}</option>
                        ))}
                    </select>

                    <input type="number" placeholder="Số lượng" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
                    <input type="number" placeholder="Giá nhập (VNĐ)" value={importPrice} onChange={(e) => setImportPrice(e.target.value)} min="0" />

                    <button className="btn-add-detail" onClick={handleAddDetail}>+ Thêm</button>
                </div>
            </div>

            {/* ====== PHẦN 3: DANH SÁCH CHI TIẾT SẼ NHẬP ====== */}
            <div className="receipt-details-list">
                <table className="receipt-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên Sản Phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá nhập</th>
                            <th>Thành tiền</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Chưa có sản phẩm nào</td></tr>
                        ) : (
                            details.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.importPrice.toLocaleString()} ₫</td>
                                    <td>{item.total.toLocaleString()} ₫</td>
                                    <td><button className="btn-remove" onClick={() => handleRemoveDetail(index)}>X</button></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="receipt-grand-total">
                    <h3>Tổng tiền nhập: <span style={{ color: 'red' }}>{grandTotal.toLocaleString()} ₫</span></h3>
                </div>
            </div>

            {/* ====== NÚT LƯU VÀ HOÀN THÀNH ====== */}
            <div className="receipt-actions">
                <button className="btn-save-draft" onClick={() => handleSaveReceipt(false)}>LƯU NHÁP PHIẾU (Chưa nhập kho)</button>
                <button className="btn-complete" onClick={() => handleSaveReceipt(true)}>HOÀN THÀNH (Cập nhật Kho & Giá)</button>
            </div>
        </div>
    );
};

export default AddImportReceipt;