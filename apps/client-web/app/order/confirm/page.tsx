'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '../../../components/protected-route';
import { useAuth } from '../../../contexts/auth-context';
import { apiClient } from '../../../lib/api-client';
import { MealDto, CreateOrderItemDto, UserRole } from '@contracts/core';

function OrderConfirmContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meals, setMeals] = useState<MealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const orderDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const itemsParam = searchParams.get('items');
  const items: CreateOrderItemDto[] = itemsParam ? JSON.parse(decodeURIComponent(itemsParam)) : [];

  const selectedMeals = useMemo(() => {
    const mealMap = new Map(meals.map(m => [m.id, m]));
    return items
      .map(item => {
        const meal = mealMap.get(item.mealId);
        return meal ? { meal, quantity: item.quantity } : null;
      })
      .filter((item): item is { meal: MealDto; quantity: number } => item !== null);
  }, [meals, items]);

  const totalAmount = selectedMeals.reduce(
    (sum, { meal, quantity }) => sum + meal.price * quantity,
    0
  );

  useEffect(() => {
    if (items.length === 0) {
      router.push('/menu');
      return;
    }
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual endpoint once backend is implemented
      // const data = await apiClient.getMealsForDate(orderDate);
      // setMeals(data);
      setMeals([]); // Placeholder - in production, fetch actual meals
      setError('Meal data endpoint not yet implemented in backend');
    } catch (err: any) {
      setError(err.message || 'Failed to load meal information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiClient.createOrder({
        orderDate,
        items,
      });
      router.push('/orders?success=true');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to place order';
      if (errorMessage.includes('cutoff') || errorMessage.includes('cut-off')) {
        setError('Ordering cutoff time has passed. Please contact your business admin.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading order details...</p>
        </div>
      </ProtectedRoute>
    );
  }

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
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Confirm Order</h1>
            <button
              onClick={() => router.push('/menu')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Back
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1rem' }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                Order Date
              </p>
              <p style={{ fontWeight: '600' }}>
                {new Date(orderDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Order Items
              </h2>
              {selectedMeals.map(({ meal, quantity }) => (
                <div
                  key={meal.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500' }}>{meal.name}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                      {quantity} × {meal.price.toFixed(2)} TND
                    </p>
                  </div>
                  <p style={{ fontWeight: '600' }}>
                    {(meal.price * quantity).toFixed(2)} TND
                  </p>
                </div>
              ))}
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <div style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0070f3' }}>
                  {totalAmount.toFixed(2)} TND
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedMeals.length === 0}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: submitting || selectedMeals.length === 0 ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: submitting || selectedMeals.length === 0 ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>

            <p style={{ 
              fontSize: '0.85rem', 
              color: '#666', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Note: Orders cannot be modified after the cutoff time.
            </p>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}

export default function OrderConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    }>
      <OrderConfirmContent />
    </Suspense>
  );
}
