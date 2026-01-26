'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { OrderDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Empty } from '../../../components/ui/empty';
import { Error } from '../../../components/ui/error';
import { CollapsibleSection } from '../../../components/layouts/CollapsibleSection';
import { CheckCircle, Clock, X, Package, Calendar } from 'lucide-react';
import { getTodayISO, getTomorrowISO, formatDateToISO } from '../../../lib/date-utils';
import { getTodayISO, getTomorrowISO, formatDateToISO } from '../../../lib/date-utils';

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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
      setError('');
      const data = await apiClient.getMyOrders();
      // Sort by order date (most recent first)
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.orderDate).getTime();
        const dateB = new Date(b.orderDate).getTime();
        return dateB - dateA;
      });
      setOrders(sorted);
      // Auto-expand most recent order
      if (sorted.length > 0) {
        setExpandedOrders(new Set([sorted[0].id]));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.LOCKED:
        return {
          icon: CheckCircle,
          description: 'Confirmed - Ready for pickup',
          className: 'bg-success-50 text-success-700 border-success-300',
        };
      case OrderStatus.CREATED:
        return {
          icon: Clock,
          description: 'Pending confirmation',
          className: 'bg-warning-50 text-warning-700 border-warning-300',
        };
      case OrderStatus.CANCELLED:
        return {
          icon: X,
          description: 'Cancelled',
          className: 'bg-destructive/10 text-destructive border-destructive/30',
        };
      default:
        return {
          icon: Clock,
          description: status,
          className: 'bg-secondary-100 text-secondary-700 border-secondary-300',
        };
    }
  };

  // Group orders by week
  const ordersByWeek = useMemo(() => {
    const grouped: Record<string, OrderDto[]> = {};
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start from Sunday

    orders.forEach((order) => {
      const orderDate = new Date(order.orderDate);
      const weekStart = new Date(orderDate);
      weekStart.setDate(orderDate.getDate() - orderDate.getDay()); // Start from Sunday
      
      const { formatDateToISO } = await import('../../../lib/date-utils');
      const weekKey = formatDateToISO(weekStart);
      
      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(order);
    });

    // Sort weeks (most recent first)
    return Object.entries(grouped).sort(([a], [b]) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [orders]);

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = getTodayISO();
    const tomorrow = getTomorrowISO();

    if (dateString === today) {
      return 'Today';
    } else if (dateString === tomorrow) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatWeekHeader = (weekStart: string) => {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    if (weekStart === formatDateToISO(thisWeekStart)) {
      return 'This Week';
    } else if (weekStart === formatDateToISO(lastWeekStart)) {
      return 'Last Week';
    } else {
      return `Week of ${weekStartDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading message="Loading orders..." />
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
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <p className="text-sm text-gray-600 mt-1">
          View all your past and upcoming orders
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

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-8 w-full max-w-md mx-auto">
          <Empty
            message="No orders yet"
            description="Place your first order to get started"
          />
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/new-order')}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-semibold min-h-[44px]"
            >
              Place Your First Order
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersByWeek.map(([weekStart, weekOrders]) => (
            <div key={weekStart} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 px-1">
                {formatWeekHeader(weekStart)}
              </h2>
              {weekOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedOrders.has(order.id);

                return (
                  <CollapsibleSection
                    key={order.id}
                    title={
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold">{formatOrderDate(order.orderDate)}</span>
                          <span className="text-sm text-gray-500 font-normal">
                            {order.totalAmount.toFixed(2)} TND
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 ${statusInfo.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {order.status}
                        </div>
                      </div>
                    }
                    defaultOpen={isExpanded}
                    headerClassName="py-3"
                  >
                    <div className="space-y-3 pt-2">
                      {/* Pack Info */}
                      <div className="bg-surface-light rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-primary-600" />
                          <p className="font-semibold text-gray-900">{order.packName}</p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.packPrice.toFixed(2)} TND
                        </p>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Your Selection
                        </p>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="py-2 border-b border-surface-dark last:border-0"
                          >
                            <p className="text-sm text-gray-700 font-normal">
                              <span className="font-medium text-gray-900">{item.componentName}:</span>{' '}
                              {item.variantName}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Status Description */}
                      <div className="bg-background rounded-lg p-3 border border-surface-dark">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 text-gray-600" />
                          <p className="text-sm text-gray-600 font-normal">
                            {statusInfo.description}
                          </p>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center pt-2 border-t border-surface-dark">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-semibold text-primary-600">
                          {order.totalAmount.toFixed(2)} TND
                        </span>
                      </div>
                    </div>
                  </CollapsibleSection>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loading message="Loading..." />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
