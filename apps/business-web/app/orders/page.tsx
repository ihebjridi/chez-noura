'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { OrderDto, UserRole, OrderStatus } from '@contracts/core';
import Link from 'next/link';

export default function OrdersPage() {
  const { logout } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getBusinessOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ marginRight: '1rem', textDecoration: 'none' }}>← Dashboard</Link>
            <h1 style={{ display: 'inline', marginLeft: '1rem' }}>Orders Overview</h1>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}>
            <p>No orders found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>Order {order.id.substring(0, 8)}...</h3>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: order.status === OrderStatus.LOCKED ? '#d4edda' : order.status === OrderStatus.CREATED ? '#fff3cd' : '#f8d7da',
                        color: order.status === OrderStatus.LOCKED ? '#155724' : order.status === OrderStatus.CREATED ? '#856404' : '#721c24',
                        fontSize: '0.9rem'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      <strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      <strong>Employee:</strong> {order.employeeName} ({order.employeeEmail})
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      <strong>Pack:</strong> {order.packName} - {order.packPrice.toFixed(2)} TND
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                      Total: {order.totalAmount.toFixed(2)} TND
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: expandedOrderId === order.id ? '#666' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {expandedOrderId === order.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {expandedOrderId === order.id && (
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #eee'
                  }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Component Selections:</h4>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '4px',
                            border: '1px solid #eee'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{item.componentName}</strong>
                            </div>
                            <div style={{ color: '#666' }}>
                              {item.variantName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
