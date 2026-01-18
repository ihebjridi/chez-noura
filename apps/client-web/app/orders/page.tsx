'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { OrderDto, UserRole, OrderStatus } from '@contracts/core';

function OrdersContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
    loadOrders();
  }, [searchParams]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual endpoint once backend is implemented
      // const data = await apiClient.getMyOrders();
      // setOrders(data);
      setOrders([]); // Placeholder
      setError('Employee orders endpoint not yet implemented in backend');
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return { bg: '#d4edda', color: '#155724' };
      case OrderStatus.PENDING:
        return { bg: '#fff3cd', color: '#856404' };
      case OrderStatus.CANCELLED:
        return { bg: '#f8d7da', color: '#721c24' };
      default:
        return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
        <header style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600' }}>My Orders</h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => router.push('/menu')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                New Order
              </button>
              <button
                onClick={logout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {success && (
          <div style={{
            margin: '1rem',
            padding: '1rem',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            ✓ Order placed successfully!
          </div>
        )}

        {error && !loading && (
          <div style={{
            margin: '1rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'white',
            margin: '1rem',
            borderRadius: '8px'
          }}>
            <p style={{ marginBottom: '1rem' }}>No orders yet.</p>
            <button
              onClick={() => router.push('/menu')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Place Your First Order
            </button>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {orders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
                        {new Date(order.orderDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#999' }}>
                        Order #{order.id.substring(0, 8)}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: '500' }}>{item.mealName}</p>
                          <p style={{ fontSize: '0.85rem', color: '#666' }}>
                            {item.quantity} × {item.mealPrice.toFixed(2)} TND
                          </p>
                        </div>
                        <p style={{ fontWeight: '600' }}>
                          {(item.mealPrice * item.quantity).toFixed(2)} TND
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '2px solid #eee'
                  }}>
                    <span style={{ fontWeight: '600' }}>Total:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0070f3' }}>
                      {order.totalAmount.toFixed(2)} TND
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
