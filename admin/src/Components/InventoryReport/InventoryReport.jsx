import React, { useState } from 'react';
import './InventoryReport.css';

const InventoryReport = () => {
    // State quản lý Tab đang active (1, 2, hoặc 3)
    const [activeTab, setActiveTab] = useState(1);

    // State cho Tab 1: Tồn kho tại 1 thời điểm
    const [targetTime, setTargetTime] = useState('');
    const [category, setCategory] = useState('all');
    const [stockData, setStockData] = useState([]);

    // State cho Tab 2: Báo cáo Nhập - Xuất
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [ioData, setIoData] = useState([]);

    // State cho Tab 3: Cảnh báo sắp hết hàng
    const [threshold, setThreshold] = useState(10); // Mặc định cảnh báo dưới 10 cái
    const [lowStockData, setLowStockData] = useState([]);

    // --- CÁC HÀM GỌI API ---

    const fetchStockAtTime = async () => {
        if (!targetTime) return alert('Vui lòng chọn mốc thời gian!');
        try {
            const res = await fetch(`http://localhost:4000/api/reports/stock-at-time?targetTime=${targetTime}&category=${category}`);
            const data = await res.json();
            if (data.success) setStockData(data.data);
            else alert(data.message);
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối máy chủ');
        }
    };

    const fetchIOReport = async () => {
        if (!startDate || !endDate) return alert('Vui lòng chọn đầy đủ Từ ngày và Đến ngày!');
        if (new Date(startDate) > new Date(endDate)) return alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
        try {
            const res = await fetch(`http://localhost:4000/api/reports/import-export?startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();
            if (data.success) setIoData(data.data);
            else alert(data.message);
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối máy chủ');
        }
    };

    const fetchLowStock = async () => {
        if (threshold === '' || threshold < 0) return alert('Ngưỡng số lượng không hợp lệ!');
        try {
            const res = await fetch(`http://localhost:4000/api/reports/low-stock?threshold=${threshold}`);
            const data = await res.json();
            if (data.success) setLowStockData(data.data);
            else alert(data.message);
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối máy chủ');
        }
    };

    return (
        <div className="report-container">
            <h2 className="report-title">Báo Cáo & Thống Kê Tồn Kho</h2>
            <p className="report-subtitle">Quản lý dòng chảy hàng hóa và theo dõi hiện trạng kho hàng.</p>

            {/* Thanh Tabs */}
            <div className="report-tabs">
                <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
                    1. Tồn kho tại thời điểm
                </button>
                <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
                    2. Nhập / Xuất theo kỳ
                </button>
                <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
                    3. Cảnh báo hết hàng
                </button>
            </div>

            <div className="report-card">
                {/* NỘI DUNG TAB 1 */}
                {activeTab === 1 && (
                    <div className="tab-content">
                        <div className="filter-bar">
                            <div className="filter-group">
                                <label>Chọn thời điểm:</label>
                                <input type="datetime-local" value={targetTime} onChange={(e) => setTargetTime(e.target.value)} />
                            </div>
                            <div className="filter-group">
                                <label>Phân loại:</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="all">Tất cả sản phẩm</option>
                                    <option value="women">Phụ nữ</option>
                                    <option value="men">Đàn ông</option>
                                    <option value="kid">Trẻ em</option>
                                </select>
                            </div>
                            <button className="btn-fetch" onClick={fetchStockAtTime}>Tra Cứu</button>
                        </div>

                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Mã SP</th>
                                    <th>Tên Sản Phẩm</th>
                                    <th>Tổng Nhập (Đến mốc T)</th>
                                    <th>Tổng Xuất (Đến mốc T)</th>
                                    <th>Tồn Kho Thực Tế</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockData.length === 0 ? <tr><td colSpan="5" className="empty-row">Chưa có dữ liệu. Hãy chọn thời gian và bấm Tra Cứu.</td></tr> :
                                    stockData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.code || `SP${item.id}`}</td>
                                            <td style={{ fontWeight: 500 }}>{item.name}</td>
                                            <td style={{ color: '#10b981' }}>{item.total_imported}</td>
                                            <td style={{ color: '#ef4444' }}>{item.total_sold}</td>
                                            <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.stock_at_time}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* NỘI DUNG TAB 2 */}
                {activeTab === 2 && (
                    <div className="tab-content">
                        <div className="filter-bar">
                            <div className="filter-group">
                                <label>Từ ngày:</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="filter-group">
                                <label>Đến ngày:</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <button className="btn-fetch" onClick={fetchIOReport}>Xem Báo Cáo</button>
                        </div>

                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Mã SP</th>
                                    <th>Tên Sản Phẩm</th>
                                    <th>Số lượng Nhập vào</th>
                                    <th>Số lượng Bán ra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ioData.length === 0 ? <tr><td colSpan="4" className="empty-row">Chưa có dữ liệu. Hãy chọn khoảng thời gian và bấm Xem Báo Cáo.</td></tr> :
                                    ioData.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.code || `SP${item.id}`}</td>
                                            <td style={{ fontWeight: 500 }}>{item.name}</td>
                                            <td style={{ fontWeight: 'bold', color: '#10b981' }}>+ {item.total_imported}</td>
                                            <td style={{ fontWeight: 'bold', color: '#ef4444' }}>- {item.total_exported}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* NỘI DUNG TAB 3 */}
                {activeTab === 3 && (
                    <div className="tab-content">
                        <div className="filter-bar">
                            <div className="filter-group">
                                <label>Cảnh báo sản phẩm có số lượng Tồn kho từ:</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="number"
                                        value={threshold}
                                        onChange={(e) => setThreshold(e.target.value)}
                                        min="0"
                                        style={{ width: '100px', fontWeight: 'bold' }}
                                    />
                                    <span>trở xuống.</span>
                                </div>
                            </div>
                            <button className="btn-fetch" onClick={fetchLowStock} style={{ backgroundColor: '#f59e0b' }}>Lọc Cảnh Báo</button>
                        </div>

                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Mã SP</th>
                                    <th>Tên Sản Phẩm</th>
                                    <th>Tồn Kho Hiện Tại</th>
                                    <th>Mức Cảnh Báo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockData.length === 0 ? <tr><td colSpan="4" className="empty-row">Chưa có dữ liệu cảnh báo.</td></tr> :
                                    lowStockData.map((item, idx) => (
                                        <tr key={idx} style={{ backgroundColor: item.stock_quantity === 0 ? '#fee2e2' : '#fef3c7' }}>
                                            <td>{item.code || `SP${item.id}`}</td>
                                            <td style={{ fontWeight: 500 }}>{item.name}</td>
                                            <td style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>
                                                {item.stock_quantity}
                                                {item.stock_quantity === 0 && <span style={{ marginLeft: '10px', fontSize: '12px', padding: '3px 8px', background: '#ef4444', color: 'white', borderRadius: '12px' }}>Hết sạch hàng</span>}
                                            </td>
                                            <td>&le; {threshold}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryReport;