'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../lib/api-client';
import { OrderDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [orderDetailsModal, setOrderDetailsModal] = useState<OrderDto | null>(null);
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
      return orders.filter((order) => {
        const orderDateOnly = order.orderDate.includes('T')
          ? order.orderDate.split('T')[0]
          : order.orderDate;
        return orderDateOnly === customDate;
      });
    }
    return orders;
  }, [orders, dateFilter, customDate]);

  const groupedOrders = useMemo(() => {
    const byDate: Record<string, OrderDto[]> = {};
    filteredOrders.forEach((order) => {
      const orderDateOnly = order.orderDate.includes('T')
        ? order.orderDate.split('T')[0]
        : order.orderDate;
      if (!byDate[orderDateOnly]) byDate[orderDateOnly] = [];
      byDate[orderDateOnly].push(order);
    });
    const sortedDates = Object.keys(byDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
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
    let locale = 'fr';
    if (typeof document !== 'undefined') {
      try {
        const cookies = document.cookie.split(';');
        const localeCookie = cookies.find((c) => c.trim().startsWith('NEXT_LOCALE='));
        if (localeCookie) {
          const loc = localeCookie.split('=')[1].trim();
          if (loc === 'fr' || loc === 'en') locale = loc;
        }
      } catch (_e) {}
    }
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-4">{t('orders.title')}</h1>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                setDateFilter('all');
                setCustomDate('');
              }}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                dateFilter === 'all'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-300 shadow-sm hover:shadow-md'
              }`}
            >
              {t('common.buttons.allOrders')}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 border-2 ${
                  dateFilter === 'custom'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-primary-300 shadow-sm hover:shadow-md'
                }`}
              >
                {customDate
                  ? new Date(customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : t('common.buttons.customDate')}
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 left-0 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setCustomDate(selectedDate);
                      if (selectedDate) setDateFilter('custom');
                      setShowDatePicker(false);
                    }}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 font-medium"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={loadOrders} />
        </div>
      )}

      {loading && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-12">
          <Loading message={t('orders.loadingOrders')} />
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-12">
          <Empty
            message={t('orders.noOrders')}
            description={t('orders.noOrdersDescription')}
          />
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {groupedOrders.sortedDates.map((dateKey) => {
            const ordersForDate = groupedOrders.byDate[dateKey];
            const totalOrdersForDate = ordersForDate.length;
            const totalAmountForDate = ordersForDate.reduce(
              (sum, o) => sum + (o.totalAmount || 0),
              0,
            );
            const isExpanded = expandedDate === dateKey;

            return (
              <div
                key={dateKey}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <button
                  onClick={() => setExpandedDate(isExpanded ? null : dateKey)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(dateKey)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {totalOrdersForDate}{' '}
                        {totalOrdersForDate !== 1
                          ? t('common.labels.orders')
                          : t('common.labels.order')}{' '}
                        • {totalAmountForDate.toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-600 font-semibold">
                          <th className="pb-2 pr-4">{t('common.labels.employee')}</th>
                          <th className="pb-2 pr-4">{t('common.labels.packLabel')}</th>
                          <th className="pb-2 pr-4 text-right">{t('common.labels.amount')}</th>
                          <th className="pb-2 pr-4">{t('common.labels.status')}</th>
                          <th className="pb-2 w-28"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersForDate.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                          >
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {order.employeeName}
                                </p>
                                <p className="text-xs text-gray-500">{order.employeeEmail}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-gray-700">
                              {order.packName} — {order.packPrice.toFixed(2)} TND
                            </td>
                            <td className="py-3 pr-4 text-right font-medium text-gray-900">
                              {order.totalAmount.toFixed(2)} TND
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                  order.status,
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                type="button"
                                onClick={() => setOrderDetailsModal(order)}
                                className="text-primary-600 hover:text-primary-700 font-semibold text-xs"
                              >
                                {t('common.buttons.showDetails')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Order details modal */}
      {orderDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('orders.orderNumber', {
                  id: orderDetailsModal.id.substring(0, 8),
                })}
              </h3>
              <button
                type="button"
                onClick={() => setOrderDetailsModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">
                <strong>{t('common.labels.employee')}:</strong>{' '}
                {orderDetailsModal.employeeName} ({orderDetailsModal.employeeEmail})
              </p>
              <p className="text-sm text-gray-600">
                <strong>{t('common.labels.packLabel')}:</strong>{' '}
                {orderDetailsModal.packName} — {orderDetailsModal.packPrice.toFixed(2)} TND
              </p>
              <p className="text-sm text-gray-600">
                <strong>{t('common.labels.amount')}:</strong>{' '}
                {orderDetailsModal.totalAmount.toFixed(2)} TND
              </p>
              <p className="text-sm text-gray-600">
                <strong>{t('common.labels.status')}:</strong>{' '}
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                    orderDetailsModal.status,
                  )}`}
                >
                  {orderDetailsModal.status}
                </span>
              </p>
              <h4 className="text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                {t('common.labels.componentSelections')}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {orderDetailsModal.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {item.variantImageUrl ? (
                      <img
                        src={`${API_BASE_URL}${item.variantImageUrl}`}
                        alt={item.variantName}
                        className="w-10 h-10 object-cover rounded-md border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                        {t('common.labels.noImage')}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.componentName}
                      </p>
                      <p className="text-xs text-gray-600">{item.variantName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
