'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { MealDto, UserRole, OrderDto, OrderStatus, EntityStatus } from '@contracts/core';
import { DegradedModeBanner } from '../../components/degraded-mode-banner';

export default function MenuPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<MealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMeals, setSelectedMeals] = useState<Record<string, number>>({});
  const [todayOrder, setTodayOrder] = useState<OrderDto | null>(null);
  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMeals();
    checkTodayOrder();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getMealsForDate(today);
      // Filter only active meals
      const activeMeals = data.filter(
        (meal) => meal.isActive && meal.status === EntityStatus.ACTIVE,
      );
      setMeals(activeMeals);
    } catch (err: any) {
      setError(err.message || 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayOrder = async () => {
    try {
      const orders = await apiClient.getMyOrders();
      const todayOrderData = orders.find(
        (order) => order.orderDate === today && order.status !== OrderStatus.CANCELLED,
      );
      setTodayOrder(todayOrderData || null);
    } catch (err) {
      // Silently fail - not critical
      console.error('Failed to check today order:', err);
    }
  };

  const handleQuantityChange = (mealId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedMeals };
      delete newSelected[mealId];
      setSelectedMeals(newSelected);
    } else {
      setSelectedMeals({ ...selectedMeals, [mealId]: quantity });
    }
  };

  const totalAmount = meals.reduce((sum, meal) => {
    const quantity = selectedMeals[meal.id] || 0;
    return sum + meal.price * quantity;
  }, 0);

  const hasSelection = Object.keys(selectedMeals).length > 0;

  const handleProceed = () => {
    if (todayOrder) {
      setError('You have already placed an order for today. Only one order per day is allowed.');
      return;
    }

    const items = Object.entries(selectedMeals).map(([mealId, quantity]) => ({
      mealId,
      quantity,
    }));

    if (items.length === 0) {
      setError('Please select at least one meal');
      return;
    }

    router.push(`/order/confirm?date=${today}&items=${encodeURIComponent(JSON.stringify(items))}`);
  };

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <DegradedModeBanner />
      <div style={{ 
        minHeight: '100vh',
        paddingBottom: '5rem' // Space for fixed bottom bar
      }}>
        <header style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Today's Iftar Menu</h1>
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
          {user && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              {user.email}
            </p>
          )}
        </header>

        {todayOrder && (
          <div style={{
            margin: '1rem',
            padding: '1rem',
            backgroundColor: todayOrder.status === OrderStatus.LOCKED ? '#d4edda' : '#fff3cd',
            color: todayOrder.status === OrderStatus.LOCKED ? '#155724' : '#856404',
            borderRadius: '8px',
            fontSize: '0.9rem',
            border: `1px solid ${todayOrder.status === OrderStatus.LOCKED ? '#c3e6cb' : '#ffeaa7'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong>Today's Order Status:</strong>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: todayOrder.status === OrderStatus.LOCKED ? '#155724' : '#856404',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                {todayOrder.status}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {todayOrder.status === OrderStatus.LOCKED
                ? 'Your order has been locked and confirmed.'
                : 'Your order has been placed and is pending confirmation.'}
            </p>
            <button
              onClick={() => router.push('/orders')}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: `1px solid ${todayOrder.status === OrderStatus.LOCKED ? '#155724' : '#856404'}`,
                borderRadius: '4px',
                color: todayOrder.status === OrderStatus.LOCKED ? '#155724' : '#856404',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            >
              View Order Details
            </button>
          </div>
        )}

        {error && !loading && (
          <div style={{
            margin: '1rem',
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {todayOrder && !loading && (
          <div style={{
            margin: '1rem',
            padding: '1rem',
            backgroundColor: '#e7f3ff',
            color: '#004085',
            borderRadius: '8px',
            fontSize: '0.9rem',
            border: '1px solid #b3d9ff'
          }}>
            <strong>Note:</strong> You have already placed an order for today. You can view it in the Orders section.
          </div>
        )}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Loading menu...</p>
          </div>
        ) : meals.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'white',
            margin: '1rem',
            borderRadius: '8px'
          }}>
            <p>No meals available for today.</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Check back later or contact your business admin.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            {meals.map((meal) => {
              const quantity = selectedMeals[meal.id] || 0;
              return (
                <div
                  key={meal.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {meal.name}
                    </h3>
                    {meal.description && (
                      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                        {meal.description}
                      </p>
                    )}
                    <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0070f3', marginTop: '0.5rem' }}>
                      {meal.price.toFixed(2)} TND
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => handleQuantityChange(meal.id, quantity - 1)}
                      disabled={quantity === 0}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid #ddd',
                        backgroundColor: quantity === 0 ? '#f5f5f5' : 'white',
                        cursor: quantity === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      −
                    </button>
                    <span style={{ 
                      minWidth: '2rem', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(meal.id, quantity + 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '1px solid #ddd',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fixed bottom bar for order summary */}
        {hasSelection && !todayOrder && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            padding: '1rem',
            borderTop: '1px solid #eee',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            zIndex: 10
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontWeight: '600' }}>Total:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0070f3' }}>
                {totalAmount.toFixed(2)} TND
              </span>
            </div>
            <button
              onClick={handleProceed}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Review Order
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
