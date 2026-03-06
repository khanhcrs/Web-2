import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import './CSS/OrderDetail.css';
import { resolveImageUrl, API_BASE_URL } from '../config';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { token } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!token) {
        setLoading(false);
        setError('Vui lòng đăng nhập để xem chi tiết đơn hàng.');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/order/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Không thể tải chi tiết đơn hàng.');
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [orderId, token]);

  if (loading) return <div className='order-detail'><h1>Chi tiết đơn hàng</h1><p>Đang tải...</p></div>;
  if (error) return <div className='order-detail'><h1>Chi tiết đơn hàng</h1><p className="error-msg">{error}</p></div>;
  if (!order) return <div className='order-detail'><h1>Chi tiết đơn hàng</h1><p>Không tìm thấy đơn hàng.</p></div>;

  // XỬ LÝ DỮ LIỆU ĐỊA CHỈ: Quan trọng nhất để hết bị N/A
  const shippingInfo = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const subtotal = order.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  const shippingFee = order.shipping_fee || 0;
  const tax = order.tax || 0;
  const totalAmount = subtotal + shippingFee + tax;

  return (
    <div className='order-detail'>
      <h1>Chi tiết đơn hàng</h1>
      <div className="order-detail-container">

        <div className="order-detail-section">
          <h2>Thông tin đơn hàng</h2>
          <p><strong>Mã đơn hàng:</strong> #{order.id}</p>
          <p><strong>Ngày đặt:</strong> {new Date(order.created_at).toLocaleString('vi-VN')}</p>
          <p><strong>Trạng thái:</strong> <span className="status-label">{order.status}</span></p>
        </div>

        <div className="order-detail-section">
          <h2>Thông tin sản phẩm</h2>
          {order.items?.map(item => (
            <div key={item.id} className="order-product-item">
              <img src={resolveImageUrl(item.image)} alt={item.name} />
              <div className="order-product-info">
                <p className="product-name"><strong>{item.name}</strong></p>
                <p>Số lượng: {item.quantity}</p>
                <p>Giá: {Number(item.price).toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          ))}
        </div>

        <div className="order-detail-section">
          <h2>Thông tin thanh toán</h2>
          <div className="payment-row"><span>Tạm tính:</span> <span>{subtotal.toLocaleString('vi-VN')} ₫</span></div>
          <div className="payment-row"><span>Phí vận chuyển:</span> <span>{shippingFee.toLocaleString('vi-VN')} ₫</span></div>
          <div className="payment-row total"><span>Tổng cộng:</span> <span>{totalAmount.toLocaleString('vi-VN')} ₫</span></div>
        </div>

        {/* PHẦN ĐÃ SỬA: Gọi shippingInfo thay vì order.shipping_address */}
        <div className="order-detail-section">
          <h2>Thông tin giao hàng</h2>
          <div className="shipping-info-grid">
            <div className="info-group">
              <p><strong>NGƯỜI NHẬN:</strong></p>
              <p className="val">{shippingInfo?.name || 'Chưa cập nhật'}</p>
            </div>
            <div className="info-group">
              <p><strong>ĐỊA CHỈ:</strong></p>
              <p className="val">{shippingInfo?.address || 'Chưa cập nhật'}</p>
            </div>
            <div className="info-group">
              <p><strong>SỐ ĐIỆN THOẠI:</strong></p>
              <p className="val">{shippingInfo?.phone || 'Chưa cập nhật'}</p>
            </div>
            <div className="info-group">
              <p><strong>ĐƠN VỊ VẬN CHUYỂN:</strong></p>
              <p className="val">{order.shipping_method || 'Giao hàng tiêu chuẩn'}</p>
            </div>
            <div className="info-group">
              <p><strong>THANH TOÁN:</strong></p>
              <p className="val">
                {order.payment_method === 'cash_on_delivery' ? 'Thanh toán khi nhận hàng' : 'Thẻ tín dụng'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;