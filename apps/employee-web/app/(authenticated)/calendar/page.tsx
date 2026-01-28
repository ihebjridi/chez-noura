'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { OrderDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { Empty } from '../../../components/ui/empty';
import { CollapsibleSection } from '../../../components/layouts/CollapsibleSection';
import { CheckCircle, Clock, X, Package, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayISO, getTomorrowISO, formatDateToISO } from '../../../lib/date-utils';

const ITEMS_PER_PAGE = 10;

function OrderHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

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
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = useMemo(() => {
    return orders.slice(startIndex, endIndex);
  }, [orders, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
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
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
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
        <>
          <div className="space-y-3 mb-6">
            {paginatedOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedOrders.has(order.id);

              return (
                <CollapsibleSection
                  key={order.id}
                  title={
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 w-full pr-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base truncate">
                          {formatOrderDate(order.orderDate)}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 w-fit ${statusInfo.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{order.status}</span>
                      </div>
                    </div>
                  }
                  defaultOpen={isExpanded}
                  headerClassName="py-3 px-4"
                >
                  <div className="space-y-3 pt-2 px-4 pb-4">
                    {/* Pack Info */}
                    <div className="bg-surface-light rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <p className="font-semibold text-gray-900">{order.packName}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Your Selection
                      </p>
                      {order.items.map((item) => (
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
                        <StatusIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <p className="text-sm text-gray-600 font-normal">
                          {statusInfo.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-surface-dark">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-surface-dark hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] min-w-[44px] transition-colors ${
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'bg-surface border border-surface-dark text-gray-700 hover:bg-surface-light'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-surface-dark hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrderHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loading message="Loading..." />
        </div>
      }
    >
      <OrderHistoryContent />
    </Suspense>
  );
}
