import React from 'react'
import './DescriptionBox.css'

const DescriptionBox = () => {
    return (
        <div className='descriptionbox'>
            <div className="descriptionbox-navigator">
                <div className="descriptionbox-nav-box">Mô tả</div>
                <div className="descriptionbox-nav-box fade">Đánh giá (122)</div>
            </div>
            <div className="descriptionbox-description">
                <p>
                    Website thương mại điện tử là nền tảng trực tuyến giúp việc mua bán sản phẩm hoặc dịch vụ diễn ra qua internet.
                    Đây là chợ ảo nơi doanh nghiệp và cá nhân giới thiệu sản phẩm, tương tác với khách hàng và giao dịch mà không cần hiện diện vật lý.
                    Các trang thương mại điện tử ngày càng phổ biến nhờ sự tiện lợi, dễ tiếp cận và khả năng mở rộng ra thị trường toàn cầu.
                </p>
                <p>
                    Thông thường, website thương mại điện tử hiển thị sản phẩm cùng mô tả chi tiết, hình ảnh, giá bán và các lựa chọn khác nhau như kích thước, màu sắc.
                    Mỗi sản phẩm đều có trang riêng với thông tin liên quan, đánh giá từ khách hàng và tuỳ chọn mua hàng để giúp người mua đưa ra quyết định chính xác.

                </p>
            </div>
        </div>
    )
}

export default DescriptionBox
