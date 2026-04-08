import { useContext, useEffect, useMemo, useState } from 'react'
import './CSS/Checkout.css'
import { Link } from 'react-router-dom'
import { ShopContext } from '../Context/ShopContext'
import { AuthContext } from '../Context/AuthContext'
import { createOrder } from '../services/orderService'

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
}

const paymentMethodLabels = {
  credit_card: 'The tin dung/Ghi no',
  cash_on_delivery: 'Thanh toan khi nhan hang',
}

const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return `${amount.toLocaleString('vi-VN')} VND`
}

const Checkout = () => {
  const { cartItems, products, clearCart } = useContext(ShopContext)
  const { user } = useContext(AuthContext)
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!user) {
      return
    }

    const userKey = user.id || user.email || user.name

    let defaultName = user.name || ''
    let defaultPhone = ''
    let defaultAddress = ''

    try {
      const storedAddresses = localStorage.getItem('account_addresses')
      if (storedAddresses) {
        const parsed = JSON.parse(storedAddresses)
        const userAddressList = parsed[userKey]

        if (Array.isArray(userAddressList) && userAddressList.length > 0) {
          const firstAddress = userAddressList[0]

          defaultName = firstAddress.fullName || defaultName
          defaultPhone = firstAddress.phone || ''

          const addressParts = [
            firstAddress.street,
            firstAddress.ward,
            firstAddress.district,
            firstAddress.city
          ].filter(Boolean)

          defaultAddress = addressParts.join(', ')
        }
      }
    } catch (storageError) {
      console.error('Khong the doc du lieu dia chi.', storageError)
    }

    setFormData((prev) => ({
      ...prev,
      name: prev.name || defaultName,
      email: user.email || '',
      phone: prev.phone || defaultPhone,
      address: prev.address || defaultAddress
    }))
  }, [user])

  const items = useMemo(
    () =>
      Object.entries(cartItems)
        .filter(([, quantity]) => quantity > 0)
        .map(([key, quantity]) => {
          const [productId, size] = key.split('-')
          const product = products.find((entry) => entry.id === Number(productId))
          if (!product) {
            return null
          }

          return {
            id: product.id,
            key,
            name: product.name,
            image: product.image,
            price: product.new_price,
            quantity,
            size: size !== 'default' ? size : null,
          }
        })
        .filter(Boolean),
    [cartItems, products]
  )

  const hasItems = items.length > 0
  const isEmailSynced = Boolean(user?.email)
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const handleInputChange = (event) => {
    const { name, value } = event.target
    if (name === 'email' && user?.email) {
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePaymentMethodChange = (event) => {
    const method = event.target.value
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
      ...(method !== 'credit_card'
        ? {
            cardNumber: '',
            cardholderName: '',
            expiryMonth: '',
            expiryYear: '',
            cvv: ''
          }
        : {})
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!hasItems) {
      setError('Gio hang cua ban dang trong.')
      return
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.address.trim() || !formData.phone.trim()) {
      setError('Vui long dien day du ho ten, email, dia chi va so dien thoai.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
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
        status: formData.paymentMethod === 'credit_card' ? 'processing' : 'pending',
        shippingAddress: formData.address.trim(),
        paymentMethod: formData.paymentMethod
      }

      const data = await createOrder(payload)

      setOrder({
        ...data.order,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'credit_card' ? 'paid' : 'pending',
        shippingAddress: formData.address.trim(),
        customerPhone: formData.phone.trim()
      })

      clearCart()
      setFormData(initialFormState)
    } catch (submitError) {
      setError(submitError.message || 'Thanh toan that bai.')
    } finally {
      setSubmitting(false)
    }
  }

  if (order) {
    return (
      <div className='checkout'>
        <h1>Thanh toan</h1>
        <div className='checkout-success'>
          <h2>Dat hang thanh cong!</h2>
          <div className='order-summary-box'>
            <p>Ma don hang: <strong>#{order.orderId}</strong></p>
            <p>Nguoi nhan: <strong>{order.customerName}</strong></p>
            <p>SDT: <strong>{order.customerPhone}</strong></p>
            <p>Dia chi: <strong>{order.shippingAddress}</strong></p>
            <p>Phuong thuc: {paymentMethodLabels[order.paymentMethod]}</p>
          </div>
          <div className='checkout-success-items'>
            {order.items?.map((item) => (
              <div key={`${item.productId}-${item.size || 'default'}`} className='checkout-success-item'>
                <span>{item.name} (x{item.quantity})</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className='checkout-success-total'>Tong cong: {formatCurrency(order.total)}</div>
          <Link className='checkout-success-link' to='/'>
            Tiep tuc mua sam
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='checkout'>
      <h1>Thanh toan</h1>
      <div className='checkout-content'>
        <div className='checkout-summary'>
          <h2>Don hang cua ban</h2>
          {items.map((item) => (
            <div key={item.key} className='checkout-summary-item'>
              <span>{item.name} (x{item.quantity})</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className='checkout-summary-total'>Tong cong: {formatCurrency(total)}</div>
        </div>

        <form className='checkout-form' onSubmit={handleSubmit}>
          <div className='checkout-form-group'>
            <label>Ho va ten</label>
            <input
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              placeholder='Nguyen Van A'
              required
            />
          </div>

          <div className='checkout-form-group'>
            <label>So dien thoai</label>
            <input
              name='phone'
              value={formData.phone}
              onChange={handleInputChange}
              placeholder='090xxxxxxx'
              required
            />
          </div>

          <div className='checkout-form-group'>
            <label>Email</label>
            <input
              name='email'
              type='email'
              value={formData.email}
              onChange={isEmailSynced ? undefined : handleInputChange}
              readOnly={isEmailSynced}
              required
            />
          </div>

          <div className='checkout-form-group'>
            <label>Dia chi giao hang</label>
            <textarea
              name='address'
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>

          <div className='checkout-form-group'>
            <label>Phuong thuc thanh toan</label>
            <select name='paymentMethod' value={formData.paymentMethod} onChange={handlePaymentMethodChange}>
              <option value='cash_on_delivery'>Thanh toan khi nhan hang</option>
              <option value='credit_card'>The tin dung/Ghi no</option>
            </select>
          </div>

          {formData.paymentMethod === 'credit_card' && (
            <div className='checkout-card-fields'>
              <div className='checkout-form-group'>
                <label htmlFor='cardNumber'>So the</label>
                <input
                  id='cardNumber'
                  name='cardNumber'
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder='1234 5678 9012 3456'
                  required
                />
              </div>

              <div className='checkout-form-group'>
                <label htmlFor='cardholderName'>Ten chu the</label>
                <input
                  id='cardholderName'
                  name='cardholderName'
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder='Ten in tren the'
                  required
                />
              </div>

              <div className='checkout-form-row'>
                <div className='checkout-form-group'>
                  <label htmlFor='expiryMonth'>Thang het han</label>
                  <input
                    id='expiryMonth'
                    name='expiryMonth'
                    value={formData.expiryMonth}
                    onChange={handleInputChange}
                    placeholder='MM'
                    required
                  />
                </div>

                <div className='checkout-form-group'>
                  <label htmlFor='expiryYear'>Nam het han</label>
                  <input
                    id='expiryYear'
                    name='expiryYear'
                    value={formData.expiryYear}
                    onChange={handleInputChange}
                    placeholder='YYYY'
                    required
                  />
                </div>

                <div className='checkout-form-group'>
                  <label htmlFor='cvv'>CVV</label>
                  <input
                    id='cvv'
                    name='cvv'
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder='123'
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className='checkout-error'>{error}</p>}
          <button type='submit' disabled={submitting}>
            {submitting ? 'Dang xu ly...' : 'Dat hang'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Checkout
