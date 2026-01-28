'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '../../../components/protected-route';
import { useAuth } from '../../../contexts/auth-context';
import { apiClient } from '../../../lib/api-client';
import {
  AvailablePackDto,
  UserRole,
  EmployeeMenuDto,
} from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { EmployeeLayout } from '../../../components/layouts/EmployeeLayout';
import { Clock, CheckCircle } from 'lucide-react';
import { getTodayISO } from '../../../lib/date-utils';

function OrderConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menu, setMenu] = useState<EmployeeMenuDto | null>(null);
  const [pack, setPack] = useState<AvailablePackDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const orderDate = searchParams.get('date') || getTodayISO();
  const dailyMenuIdParam = searchParams.get('dailyMenuId');
  const packIdParam = searchParams.get('packId');
  const itemsParam = searchParams.get('items');
  const dailyMenuId = dailyMenuIdParam || '';
  const packId = packIdParam || '';
  const items: Array<{ componentId: string; variantId: string }> = itemsParam
    ? JSON.parse(decodeURIComponent(itemsParam))
    : [];

  const totalAmount = pack ? pack.price : 0;

  useEffect(() => {
    if (!dailyMenuId || !packId || items.length === 0) {
      router.push('/menu');
      return;
    }
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const menuData = await apiClient.getEmployeeMenu(orderDate);
      setMenu(menuData);
      const selectedPack = menuData.packs.find((p) => p.id === packId);
      if (!selectedPack) {
        setError('Pack not found or no longer available');
        router.push('/menu');
        return;
      }
      setPack(selectedPack);
    } catch (err: any) {
      setError(err.message || 'Failed to load menu information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!pack || !dailyMenuId) {
        setError('Menu or pack information is missing');
        return;
      }

      const selectedVariants = items.map((item) => ({
        componentId: item.componentId,
        variantId: item.variantId,
      }));

      await apiClient.createEmployeeOrder({
        dailyMenuId,
        packId,
        selectedVariants,
      });
      router.push('/calendar?success=true');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to place order';
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
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate ready time
  const readyTime = menu?.cutoffTime
    ? (() => {
        const cutoffDate = new Date(menu.cutoffTime);
        const readyDate = new Date(cutoffDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
        const now = new Date();
        const isToday = readyDate.toDateString() === now.toDateString();
        const timeStr = readyDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return { date: readyDate, isToday, timeStr };
      })()
    : null;

  if (loading) {
    return (
      <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
        <EmployeeLayout>
          <div className="flex-1 flex items-center justify-center">
            <Loading message="Loading order details..." />
          </div>
        </EmployeeLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <EmployeeLayout showBackButton backAction={() => router.push('/menu')}>
        {pack && (
          <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
            {/* Order Summary */}
            <div className="bg-surface border border-surface-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Confirm Your Order</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-normal">Order Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(orderDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="border-t border-surface-dark pt-3">
                  <p className="text-sm text-gray-600 mb-2 font-normal">Pack</p>
                  <p className="font-semibold text-gray-900">{pack.name}</p>
                </div>

                <div className="border-t border-surface-dark pt-3 space-y-2">
                  <p className="text-sm text-gray-600 mb-2 font-normal">Your Selection</p>
                  {pack.components.map((component) => {
                    const selectedVariant = component.variants.find((v) =>
                      items.some(
                        (item) =>
                          item.componentId === component.id && item.variantId === v.id,
                      ),
                    );
                    return (
                      selectedVariant && (
                        <div key={component.id} className="flex items-center gap-3 py-2">
                          {selectedVariant.imageUrl ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${selectedVariant.imageUrl}`}
                              alt={selectedVariant.name}
                              className="w-12 h-12 object-cover rounded-md border border-surface-dark flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                              No image
                            </div>
                          )}
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{component.name}:</span>{' '}
                            <span className="text-gray-700">{selectedVariant.name}</span>
                          </div>
                        </div>
                      )
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ready Time */}
            {readyTime && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-600 font-normal">Order will be ready at:</p>
                    <p className="text-base font-semibold text-primary-700">
                      {readyTime.isToday
                        ? `Today at ${readyTime.timeStr}`
                        : readyTime.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div>
                <Error message={error} />
              </div>
            )}

            {/* Total */}
            <div className="bg-surface border border-surface-dark rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-semibold text-primary-600">
                  {totalAmount.toFixed(2)} TND
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitting || !pack || items.length === 0}
                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/menu')}
                className="w-full py-2.5 px-4 bg-surface-light text-gray-700 rounded-md hover:bg-surface-dark transition-colors font-semibold min-h-[44px]"
              >
                Back to Menu
              </button>
            </div>
          </form>
        )}
      </EmployeeLayout>
    </ProtectedRoute>
  );
}

export default function OrderConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loading message="Loading..." />
        </div>
      }
    >
      <OrderConfirmContent />
    </Suspense>
  );
}
