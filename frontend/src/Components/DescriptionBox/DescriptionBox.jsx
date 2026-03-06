import React, { useState } from 'react';
import './DescriptionBox.css';

const sizeChartRows = [
    { label: '(1) DÀI ÁO', s: '61', m: '64', l: '67', xl: '70' },
    { label: '(2) NGANG VAI', s: '53', m: '55.5', l: '58', xl: '60.5' },
    { label: '(3) NGANG THÂN', s: '59', m: '62', l: '65', xl: '68' },
    { label: '(4) DÀI TAY', s: '17', m: '18', l: '19', xl: '20' }
];

const DescriptionBox = () => {
    const [activeTab, setActiveTab] = useState('description');

    const renderContent = () => {
        if (activeTab === 'size-chart') {
            return (
                <div className="descriptionbox-size-chart">
                    <p><strong>Size chart:</strong></p>
                    <p>Mẫu nữ cao 1m58 nặng 48kg mặc sản phẩm size S.</p>
                    <p>Mẫu nữ cao 1m58 nặng 44kg mặc sản phẩm size S.</p>

                    <table className="size-chart-table">
                        <thead>
                            <tr>
                                <th>THÔNG SỐ (CM)</th>
                                <th>SIZE S</th>
                                <th>SIZE M</th>
                                <th>SIZE L</th>
                                <th>SIZE XL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sizeChartRows.map((row) => (
                                <tr key={row.label}>
                                    <td>{row.label}</td>
                                    <td>{row.s}</td>
                                    <td>{row.m}</td>
                                    <td>{row.l}</td>
                                    <td>{row.xl}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="size-chart-note">*Thông số thực tế có thể chênh lệch 0.5 - 1cm</p>
                </div>
            );
        }

        // Đã xóa hàm if (activeTab === 'reviews') ở đây

        return (
            <>
                <p>
                    Website thương mại điện tử là nền tảng trực tuyến giúp việc mua bán sản phẩm hoặc dịch vụ diễn ra qua internet.
                    Đây là chợ ảo nơi doanh nghiệp và cá nhân giới thiệu sản phẩm, tương tác với khách hàng và giao dịch mà không cần hiện diện vật lý.
                    Các trang thương mại điện tử ngày càng phổ biến nhờ sự tiện lợi, dễ tiếp cận và khả năng mở rộng ra thị trường toàn cầu.
                </p>
                <p>
                    Thông thường, website thương mại điện tử hiển thị sản phẩm cùng mô tả chi tiết, hình ảnh, giá bán và các lựa chọn khác nhau như kích thước, màu sắc.
                    Mỗi sản phẩm đều có trang riêng với thông tin liên quan, đánh giá từ khách hàng và tuỳ chọn mua hàng để giúp người mua đưa ra quyết định chính xác.
                </p>
            </>
        );
    };

    return (
        <div className='descriptionbox'>
            <div className="descriptionbox-navigator">
                <button
                    type="button"
                    className={`descriptionbox-nav-box ${activeTab === 'description' ? 'active' : 'fade'}`}
                    onClick={() => setActiveTab('description')}
                >
                    Mô tả
                </button>
                <button
                    type="button"
                    className={`descriptionbox-nav-box ${activeTab === 'size-chart' ? 'active' : 'fade'}`}
                    onClick={() => setActiveTab('size-chart')}
                >
                    Size chart
                </button>
                {/* Đã xóa nút bấm Tab Đánh giá ở đây để nhường chỗ cho Component Đánh giá thật */}
            </div>
            <div className="descriptionbox-description">
                {renderContent()}
            </div>
        </div>
    );
};

export default DescriptionBox;