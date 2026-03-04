import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Context/AuthContext';
import './CSS/OrderHistory.css';
import { resolveImageUrl } from '../config';

const OrderHistory = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        setError('Please log in to see your order history.');
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders.');
        }

        const data = await response.json();
        // Sort orders by date in descending order
        const sortedOrders = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(sortedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) {
    return <div className='order-history'><h1>My Orders</h1><p>Loading...</p></div>;
  }

  if (error) {
    return <div className='order-history'><h1>My Orders</h1><p>{error}</p></div>;
  }

  return (
    <div className='order-history'>
      <h1>My Orders</h1>
      <div className="order-history-container">
        {orders.length === 0 ? (
          <p>You have no orders.</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-item">
              <div className="order-item-header">
                <h3>Order #{order.id}</h3>
                <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="order-item-body">
                {order.items.map(item => (
                  <div key={item.id} className="order-product">
                    <img src={resolveImageUrl(item.image)} alt={item.name} />
                    <div className="order-product-info">
                      <p>{item.name}</p>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: {item.price.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-item-footer">
                <p>Total: {order.total_amount.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
