'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { OrderDto, EmployeeMenuDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { Empty } from '../../../components/ui/empty';
import { CheckCircle, Clock, Package, ArrowRight } from 'lucide-react';
import { getTodayISO } from '../../../lib/date-utils';

export default function TodayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [todayOrder, setTodayOrder] = useState<OrderDto | null>(null);
  const [menu, setMenu] = useState<EmployeeMenuDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = getTodayISO();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load both order and menu in parallel for better performance
      // Use Promise.allSettled to ensure both complete even if one fails
      const [orderResult, menuResult] = await Promise.allSettled([
        apiClient.getTodayOrder().catch((err) => {
          // If order request fails, just return null (no order for today)
          console.warn('Failed to load today order:', err);
          return null;
        }),
        apiClient.getEmployeeMenu(today).catch((err) => {
          // If menu request fails, return null (menu not available)
          if (err.message?.includes('404') || err.message?.includes('not found')) {
            return null;
          }
          console.warn('Failed to load menu:', err);
          return null;
        }),
      ]);

      // Extract values from results
      const order = orderResult.status === 'fulfilled' ? orderResult.value : null;
      const menuData = menuResult.status === 'fulfilled' ? menuResult.value : null;

      // Set order
      setTodayOrder(order);

      // Set menu (only if no order exists)
      if (!order && menuData) {
        setMenu(menuData);
      } else {
        setMenu(null);
      }
    } catch (err: any) {
      console.error('Failed to load today\'s data:', err);
      setError(err.message || 'Failed to load today\'s data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.LOCKED:
        return {
          icon: CheckCircle,
          message: 'Confirmed - Ready for pickup',
          className: 'bg-success-50 border-success-300 text-success-700',
        };
      case OrderStatus.CREATED:
        return {
          icon: Clock,
          message: 'Pending confirmation',
          className: 'bg-warning-50 border-warning-300 text-warning-800',
        };
      default:
        return {
          icon: Clock,
          message: status,
          className: 'bg-secondary-100 border-secondary-300 text-secondary-700',
        };
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
      <div className="flex-1 flex items-center justify-center">
        <Loading message="Loading today's order..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Error message={error} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-sm text-gray-600 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-success-50 border border-success-300 text-success-700 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-semibold">Order placed successfully!</p>
          </div>
        </div>
      )}

      {/* Today's Order */}
      {todayOrder ? (
        <div className="space-y-4">
          {/* Status Card */}
          {(() => {
            const statusInfo = getStatusInfo(todayOrder.status);
            const StatusIcon = statusInfo.icon;
            return (
              <div className={`p-6 rounded-lg border ${statusInfo.className}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-base">Today's Order</p>
                      <span className="px-3 py-1 rounded text-xs font-medium bg-white/50">
                        {todayOrder.status}
                      </span>
                    </div>
                    <p className="text-sm mb-4">{statusInfo.message}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pack Summary */}
          <div className="bg-surface border border-surface-dark rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900 text-lg">{todayOrder.packName}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {todayOrder.packPrice.toFixed(2)} TND
            </p>

            {/* Order Items */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Your Selection
              </p>
              {todayOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 border-b border-surface-dark last:border-0"
                >
                  {item.variantImageUrl ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${item.variantImageUrl}`}
                      alt={item.variantName}
                      className="w-12 h-12 object-cover rounded-md border border-surface-dark flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                      No image
                    </div>
                  )}
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">{item.componentName}:</span>{' '}
                    {item.variantName}
                  </p>
                </div>
              ))}
            </div>

            {/* Ready Time */}
            {readyTime && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-600 font-normal">Ready at:</p>
                    <p className="text-sm font-semibold text-primary-700">
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

            {/* Total */}
            <div className="flex justify-between items-center pt-3 border-t border-surface-dark">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-semibold text-primary-600">
                {todayOrder.totalAmount.toFixed(2)} TND
              </span>
            </div>
          </div>

          {/* View All Orders */}
          <button
            onClick={() => router.push('/calendar')}
            className="w-full px-4 py-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-light transition-colors font-medium text-gray-700 flex items-center justify-center gap-2 min-h-[44px]"
          >
            View Order History
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : menu ? (
        /* No Order, Menu Available */
        <div className="space-y-4">
          {menu.packs && menu.packs.length > 0 ? (
            <div className="bg-surface border border-surface-dark rounded-lg p-6 text-center">
              <Empty
                message="No order for today"
                description="You can place an order now"
              />
              <button
                onClick={() => router.push(`/new-order?date=${today}`)}
                className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-semibold min-h-[44px] inline-flex items-center gap-2"
              >
                Order Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-surface-dark rounded-lg p-6 text-center">
              <Empty
                message={menu.status === 'PUBLISHED' ? 'Menu is published but no packs are available' : 'Menu is not yet available for ordering'}
                description={menu.status === 'PUBLISHED' ? 'Contact your business admin' : `Menu status: ${menu.status}`}
              />
            </div>
          )}
        </div>
      ) : (
        /* No Menu Available */
        <div className="bg-surface border border-surface-dark rounded-lg p-6 text-center">
          <Empty
            message="No menu available for today"
            description="Check back later or contact your business admin"
          />
        </div>
      )}
    </div>
  );
}
