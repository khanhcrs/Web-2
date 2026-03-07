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
            <div key={item.id} className="order-product-item" style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <img src={resolveImageUrl(item.image)} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              <div className="order-product-info" style={{ flex: 1 }}>
                <p className="product-name" style={{ margin: '0 0 5px 0', fontSize: '16px' }}><strong>{item.name}</strong></p>

                {/* ĐÂY LÀ PHẦN BỔ SUNG: MÃ SP VÀ ĐƠN VỊ TÍNH */}
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  <span>Mã SP: <strong>{item.code || 'N/A'}</strong></span>
                  <span style={{ margin: '0 10px' }}>|</span>
                  <span>Đơn vị: <strong>{item.unit || 'Cái'}</strong></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#475569' }}>Số lượng: <strong>{item.quantity}</strong></p>
                  <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>{Number(item.price).toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="order-detail-section">
          <h2>Thông tin thanh toán</h2>
          <div className="payment-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Tạm tính:</span> <span>{subtotal.toLocaleString('vi-VN')} ₫</span></div>
          <div className="payment-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Phí vận chuyển:</span> <span>{shippingFee.toLocaleString('vi-VN')} ₫</span></div>
          <div className="payment-row total" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ccc', fontWeight: 'bold', fontSize: '18px' }}><span>Tổng cộng:</span> <span style={{ color: '#ef4444' }}>{totalAmount.toLocaleString('vi-VN')} ₫</span></div>
        </div>

        <div className="order-detail-section">
          <h2>Thông tin giao hàng</h2>
          <div className="shipping-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="info-group">
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>NGƯỜI NHẬN</p>
              <p className="val" style={{ margin: 0, fontWeight: '500' }}>{shippingInfo?.name || 'Chưa cập nhật'}</p>
            </div>
            <div className="info-group">
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>ĐỊA CHỈ</p>
              <p className="val" style={{ margin: 0, fontWeight: '500' }}>{shippingInfo?.address || 'Chưa cập nhật'}</p>
            </div>
            <div className="info-group">
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>SỐ ĐIỆN THOẠI</p>
              <p className="val" style={{ margin: 0, fontWeight: '500' }}>{shippingInfo?.phone || 'Chưa cập nhật'}</p>
            </div>
            <div className="info-group">
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>ĐƠN VỊ VẬN CHUYỂN</p>
              <p className="val" style={{ margin: 0, fontWeight: '500' }}>{order.shipping_method || 'Giao hàng tiêu chuẩn'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;