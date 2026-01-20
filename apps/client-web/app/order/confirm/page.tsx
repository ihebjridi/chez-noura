'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '../../../components/protected-route';
import { useAuth } from '../../../contexts/auth-context';
import { apiClient } from '../../../lib/api-client';
import { AvailablePackDto, CreateOrderDto, UserRole } from '@contracts/core';

function OrderConfirmContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pack, setPack] = useState<AvailablePackDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const orderDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const packIdParam = searchParams.get('packId');
  const itemsParam = searchParams.get('items');
  const packId = packIdParam || '';
  const items: Array<{ componentId: string; variantId: string }> = itemsParam ? JSON.parse(decodeURIComponent(itemsParam)) : [];

  const totalAmount = pack ? pack.price : 0;

  useEffect(() => {
    if (!packId || items.length === 0) {
      router.push('/menu');
      return;
    }
    loadPack();
  }, []);

  const loadPack = async () => {
    try {
      setLoading(true);
      setError('');
      const packs = await apiClient.getAvailablePacks(orderDate);
      const selectedPack = packs.find(p => p.id === packId);
      if (!selectedPack) {
        setError('Pack not found or no longer available');
        router.push('/menu');
        return;
      }
      setPack(selectedPack);
    } catch (err: any) {
      setError(err.message || 'Failed to load pack information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!pack) {
        setError('Pack information is missing');
        return;
      }
      // Generate idempotency key from order date and items
      const idempotencyKey = `${orderDate}-${packId}-${JSON.stringify(items)}-${Date.now()}`;
      await apiClient.createOrder(
        {
          orderDate,
          packId,
          items,
        },
        idempotencyKey,
      );
      router.push('/orders?success=true');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to place order';
      // Handle specific error cases
      if (
        errorMessage.includes('cutoff') ||
        errorMessage.includes('cut-off') ||
        errorMessage.includes('Ordering cutoff')
      ) {
        setError(
          'Ordering cutoff time has passed. Orders cannot be placed after the cutoff time.',
        );
      } else if (
        errorMessage.includes('already ordered') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('Conflict')
      ) {
        setError(
          'You have already placed an order for this date. Only one order per day is allowed.',
        );
      } else if (errorMessage.includes('locked') || errorMessage.includes('LOCKED')) {
        setError(
          'Ordering for this date has been locked. Please contact your business admin.',
        );
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

        {pack && (
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
                  Pack: {pack.name}
                </h2>
                {pack.components.map((component) => {
                const selectedVariant = component.variants.find(v => 
                  items.some(item => item.componentId === component.id && item.variantId === v.id)
                );
                return (
                  <div
                    key={component.id}
                    style={{
                      padding: '0.75rem 0',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                      {component.name} {component.required && <span style={{ color: '#c33' }}>*</span>}
                    </p>
                    {selectedVariant && (
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        {selectedVariant.name}
                      </p>
                    )}
                  </div>
                );
              })}
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
              disabled={submitting || !pack || items.length === 0}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: submitting || !pack || items.length === 0 ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: submitting || !pack || items.length === 0 ? 'not-allowed' : 'pointer',
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
        )}
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
