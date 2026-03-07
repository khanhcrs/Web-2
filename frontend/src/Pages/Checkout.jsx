import { useContext, useEffect, useMemo, useState } from 'react'
import './Checkout.css'
import { ShopContext } from '../Context/ShopContext'
import { API_BASE_URL, resolveImageUrl } from '../config'
import { Link } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  paymentMethod: 'cash_on_delivery',
  cardNumber: '',
  cardholderName: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
};

const paymentMethodLabels = {
  credit_card: 'Thẻ tín dụng/Ghi nợ',
  cash_on_delivery: 'Thanh toán khi nhận hàng',
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('vi-VN')} ₫`;
};

const Checkout = () => {
  const { cartItems, products, clearCart } = useContext(ShopContext)
  const { user } = useContext(AuthContext)
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  // ==========================================
  // LOGIC TỰ ĐỘNG ĐIỀN THÔNG TIN TỪ HỒ SƠ (ĐÃ NÂNG CẤP)
  // ==========================================
  useEffect(() => {
    if (!user) return;

    // 1. Xác định key của user (giống logic bên AccountProfile)
    const userKey = user.id || user.email || user.name;

    // 2. Mặc định tên và email từ AuthContext
    let defaultName = user.name || '';
    let defaultPhone = '';
    let defaultAddress = '';

    // 3. Tìm trong Sổ địa chỉ (localStorage)
    try {
      const storedAddresses = localStorage.getItem('account_addresses');
      if (storedAddresses) {
        const parsed = JSON.parse(storedAddresses);
        const userAddressList = parsed[userKey];

        // Nếu user có lưu địa chỉ, lấy địa chỉ đầu tiên (ưu tiên) để tự điền
        if (Array.isArray(userAddressList) && userAddressList.length > 0) {
          const firstAddress = userAddressList[0];

          defaultName = firstAddress.fullName || defaultName;
          defaultPhone = firstAddress.phone || '';

          // Nối các trường địa chỉ lại thành 1 chuỗi
          const addressParts = [
            firstAddress.street,
            firstAddress.ward,
            firstAddress.district,
            firstAddress.city
          ].filter(Boolean); // filter(Boolean) để loại bỏ các trường bị rỗng

          defaultAddress = addressParts.join(', ');
        }
      }
    } catch (error) {
      console.error('Không thể đọc dữ liệu địa chỉ:', error);
    }

    // 4. Đưa dữ liệu vào Form
    setFormData((prev) => ({
      ...prev,
      name: prev.name || defaultName,
      email: user.email || '',
      phone: prev.phone || defaultPhone,
      address: prev.address || defaultAddress
    }));

  }, [user]);
  // ==========================================

  const items = useMemo(() =>
    Object.entries(cartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => {
        const [productId, size] = key.split('-');
        const product = products.find((p) => p.id === Number(productId));
        if (!product) return null;
        return {
          id: product.id,
          key,
          name: product.name,
          image: product.image,
          price: product.new_price,
          quantity,
          size: size !== 'default' ? size : null,
        };
      }).filter(Boolean),
    [products, cartItems]
  );

  const hasItems = items.length > 0
  const isEmailSynced = Boolean(user?.email)
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'email' && user?.email) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (event) => {
    const method = event.target.value;
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
      ...(method !== 'credit_card' ? { cardNumber: '', cardholderName: '', expiryMonth: '', expiryYear: '', cvv: '' } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasItems) {
      setError('Giỏ hàng của bạn đang trống.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.address.trim() || !formData.phone.trim()) {
      setError('Vui lòng điền đầy đủ Họ tên, Email, Địa chỉ và Số điện thoại.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const dbStatus = formData.paymentMethod === 'credit_card' ? 'processing' : 'pending';

      const payload = {
        customerId: user ? user.id : null,
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        customerPhone: formData.phone.trim(),
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size
        })),
        total,
        status: dbStatus,
        shippingAddress: formData.address.trim(),
        paymentMethod: formData.paymentMethod
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Thanh toán thất bại.');
      }

      setOrder({
        ...data.order,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'credit_card' ? 'paid' : 'pending',
        shippingAddress: formData.address.trim(),
        customerPhone: formData.phone.trim()
      });

      clearCart();
      setFormData(initialFormState);
    } catch (submitError) {
      setError(submitError.message || 'Thanh toán thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <div className="checkout">
        <h1>Thanh toán</h1>
        <div className="checkout-success">
          <h2>Đặt hàng thành công!</h2>
          <div className="order-summary-box">
            <p>Mã đơn hàng: <strong>#{order.orderId}</strong></p>
            <p>Người nhận: <strong>{order.customerName}</strong></p>
            <p>SĐT: <strong>{order.customerPhone}</strong></p>
            <p>Địa chỉ: <strong>{order.shippingAddress}</strong></p>
            <p>Phương thức: {paymentMethodLabels[order.paymentMethod]}</p>
          </div>
          <div className="checkout-success-items">
            {order.items?.map((item) => (
              <div key={item.productId} className="checkout-success-item">
                <span>{item.name} (x{item.quantity})</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="checkout-success-total">Tổng cộng: {formatCurrency(order.total)}</div>
          <Link className="checkout-success-link" to="/">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1>Thanh toán</h1>
      <div className="checkout-content">
        <div className="checkout-summary">
          <h2>Đơn hàng của bạn</h2>
          {items.map((item) => (
            <div key={item.key} className="checkout-summary-item">
              <span>{item.name} (x{item.quantity})</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="checkout-summary-total">Tổng cộng: {formatCurrency(total)}</div>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="checkout-form-group">
            <label>Họ và tên</label>
            <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="checkout-form-group">
            <label>Số điện thoại</label>
            <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="090xxxxxxx" required />
          </div>
          <div className="checkout-form-group">
            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={isEmailSynced ? undefined : handleInputChange} readOnly={isEmailSynced} required />
          </div>
          <div className="checkout-form-group">
            <label>Địa chỉ giao hàng</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} required />
          </div>
          <div className="checkout-form-group">
            <label>Phương thức thanh toán</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handlePaymentMethodChange}>
              <option value="cash_on_delivery">Thanh toán khi nhận hàng</option>
              <option value="credit_card">Thẻ tín dụng/Ghi nợ</option>
            </select>
          </div>
          {formData.paymentMethod === 'credit_card' && (

            <div className="checkout-card-fields">

              <div className="checkout-form-group">

                <label htmlFor="cardNumber">Số thẻ</label>

                <input id="cardNumber" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="1234 5678 9012 3456" required />

              </div>

              <div className="checkout-form-group">

                <label htmlFor="cardholderName">Tên chủ thẻ</label>

                <input id="cardholderName" name="cardholderName" value={formData.cardholderName} onChange={handleInputChange} placeholder="Tên in trên thẻ" required />

              </div>

              <div className="checkout-form-row">

                <div className="checkout-form-group">

                  <label htmlFor="expiryMonth">Tháng hết hạn</label>

                  <input id="expiryMonth" name="expiryMonth" value={formData.expiryMonth} onChange={handleInputChange} placeholder="MM" required />

                </div>

                <div className="checkout-form-group">

                  <label htmlFor="expiryYear">Năm hết hạn</label>

                  <input id="expiryYear" name="expiryYear" value={formData.expiryYear} onChange={handleInputChange} placeholder="YYYY" required />

                </div>

                <div className="checkout-form-group">

                  <label htmlFor="cvv">CVV</label>

                  <input id="cvv" name="cvv" value={formData.cvv} onChange={handleInputChange} placeholder="123" required />

                </div>

              </div>

            </div>

          )}

          {error && <p className="checkout-error">{error}</p>}
          <button type="submit" disabled={submitting}>{submitting ? 'Đang xử lý...' : 'Đặt hàng'}</button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;