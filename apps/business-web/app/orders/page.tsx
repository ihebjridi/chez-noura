'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../lib/api-client';
import { OrderDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'custom'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState('');

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
      setError(err.message || t('common.messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'custom' && customDate) {
      // Backend returns orderDate as YYYY-MM-DD (local timezone)
      // Extract just the date part if it includes time, otherwise use as-is
      return orders.filter((order) => {
        const orderDateOnly = order.orderDate.includes('T') 
          ? order.orderDate.split('T')[0] 
          : order.orderDate;
        return orderDateOnly === customDate;
      });
    } else if (dateFilter === 'all') {
      return orders;
    }
    return orders;
  }, [orders, dateFilter, customDate]);

  // Group orders by date, then by employee
  const groupedOrders = useMemo(() => {
    const byDate: Record<string, Record<string, OrderDto[]>> = {};
    
    filteredOrders.forEach((order) => {
      // Backend returns orderDate as YYYY-MM-DD (local timezone)
      // Extract just the date part if it includes time, otherwise use as-is
      const orderDateOnly = order.orderDate.includes('T') 
        ? order.orderDate.split('T')[0] 
        : order.orderDate;
      const dateKey = orderDateOnly;
      if (!byDate[dateKey]) {
        byDate[dateKey] = {};
      }
      if (!byDate[dateKey][order.employeeId]) {
        byDate[dateKey][order.employeeId] = [];
      }
      byDate[dateKey][order.employeeId].push(order);
    });

    // Sort dates descending
    const sortedDates = Object.keys(byDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return { byDate, sortedDates };
  }, [filteredOrders]);

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.LOCKED:
        return 'bg-success-50 text-success-700 border-success-300';
      case OrderStatus.CREATED:
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case OrderStatus.CANCELLED:
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Get locale from cookie or default to French
    let locale = 'fr';
    if (typeof document !== 'undefined') {
      try {
        const cookies = document.cookie.split(';');
        const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='));
        if (localeCookie) {
          const loc = localeCookie.split('=')[1].trim();
          if (loc === 'fr' || loc === 'en') {
            locale = loc;
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t('orders.title')}</h1>
        
        {/* Date Filter Tabs */}
        <div className="bg-surface border border-surface-dark rounded-lg p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setDateFilter('all');
                setCustomDate('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                  : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
              }`}
            >
              {t('common.buttons.allOrders')}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border-2 ${
                  dateFilter === 'custom'
                    ? 'bg-primary-50 text-primary-700 border-primary-500'
                    : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-transparent'
                }`}
              >
                {customDate ? new Date(customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : t('common.buttons.customDate')}
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 left-0 bg-surface border border-surface-dark rounded-lg shadow-lg p-3 z-50">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setCustomDate(selectedDate);
                      if (selectedDate) {
                        setDateFilter('custom');
                      }
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={loadOrders} />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message={t('orders.loadingOrders')} />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <Empty
            message={t('orders.noOrders')}
            description={t('orders.noOrdersDescription')}
          />
        </div>
      )}

      {/* Grouped Orders by Date and Employee */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {groupedOrders.sortedDates.map((dateKey) => {
            const employeesForDate = groupedOrders.byDate[dateKey];
            const totalOrdersForDate = Object.values(employeesForDate).reduce(
              (sum, orders) => sum + orders.length,
              0
            );
            const totalAmountForDate = filteredOrders
              .filter((o) => {
                const orderDateOnly = o.orderDate.includes('T') 
                  ? o.orderDate.split('T')[0] 
                  : o.orderDate;
                return orderDateOnly === dateKey;
              })
              .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

            return (
              <div key={dateKey} className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
                {/* Date Header */}
                <button
                  onClick={() => setExpandedDate(expandedDate === dateKey ? null : dateKey)}
                  className="w-full px-6 py-4 bg-surface-light hover:bg-surface-dark transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {expandedDate === dateKey ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{formatDate(dateKey)}</h3>
                      <p className="text-sm text-gray-600">
                        {totalOrdersForDate} {totalOrdersForDate !== 1 ? t('common.labels.orders') : t('common.labels.order')} • {totalAmountForDate.toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                </button>

                {/* Employees for this date */}
                {expandedDate === dateKey && (
                  <div className="p-6 space-y-4">
                    {Object.entries(employeesForDate).map(([employeeId, employeeOrders]) => {
                      const employee = employeeOrders[0];
                      const employeeTotal = employeeOrders.reduce(
                        (sum, order) => sum + (order.totalAmount || 0),
                        0
                      );

                      return (
                        <div key={employeeId} className="border border-surface-dark rounded-lg overflow-hidden">
                          {/* Employee Header */}
                          <button
                            onClick={() =>
                              setExpandedEmployeeId(
                                expandedEmployeeId === employeeId ? null : employeeId
                              )
                            }
                            className="w-full px-4 py-3 bg-primary-50 hover:bg-primary-100 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-primary-600" />
                              <div className="text-left">
                                <p className="font-semibold text-gray-900">
                                  {employee.employeeName}
                                </p>
                                <p className="text-sm text-gray-600">{employee.employeeEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                  {employeeOrders.length} {employeeOrders.length !== 1 ? t('common.labels.orders') : t('common.labels.order')}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {employeeTotal.toFixed(2)} TND
                                </p>
                              </div>
                              {expandedEmployeeId === employeeId ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                          </button>

                          {/* Orders for this employee */}
                          {expandedEmployeeId === employeeId && (
                            <div className="p-4 space-y-3 bg-surface">
                              {employeeOrders.map((order) => (
                                <div
                                  key={order.id}
                                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                          {t('orders.orderNumber', { id: order.id.substring(0, 8) })}
                                        </h4>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                            order.status
                                          )}`}
                                        >
                                          {order.status}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-1">
                                        <strong>{t('common.labels.packLabel')}</strong> {order.packName} - {order.packPrice.toFixed(2)} TND
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-gray-900">
                                        {order.totalAmount.toFixed(2)} TND
                                      </p>
                                    </div>
                                  </div>

                                  {/* Expandable Order Details */}
                                  <button
                                    onClick={() =>
                                      setExpandedOrderId(
                                        expandedOrderId === order.id ? null : order.id
                                      )
                                    }
                                    className="w-full text-left text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                  >
                                    {expandedOrderId === order.id ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        {t('common.buttons.hideDetails')}
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        {t('common.buttons.showDetails')}
                                      </>
                                    )}
                                  </button>

                                  {expandedOrderId === order.id && (
                                    <div className="mt-3 pt-3 border-t border-surface-dark">
                                      <h5 className="text-xs font-semibold text-gray-700 mb-2">
                                        {t('common.labels.componentSelections')}:
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {order.items.map((item) => (
                                          <div
                                            key={item.id}
                                            className="p-2 bg-surface rounded border border-surface-dark"
                                          >
                                            <div className="flex items-center gap-2">
                                              {item.variantImageUrl ? (
                                                <img
                                                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${item.variantImageUrl}`}
                                                  alt={item.variantName}
                                                  className="w-10 h-10 object-cover rounded-md border border-surface-dark flex-shrink-0"
                                                />
                                              ) : (
                                                <div className="w-10 h-10 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                                                  {t('common.labels.noImage')}
                                                </div>
                                              )}
                                              <div className="flex-1 flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-900">
                                                  {item.componentName}
                                                </span>
                                                <span className="text-xs text-gray-600">
                                                  {item.variantName}
                                                </span>
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
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
