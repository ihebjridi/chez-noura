'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { OrderDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { Card } from '../../components/ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { getTodayISO } from '../../lib/date-utils';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = getTodayISO();

  const formatFullDate = (dateString: string) => {
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

  useEffect(() => {
    loadOrders();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(false); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrders(false); // Silent refresh
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh when selected date changes (but not on initial mount)
  useEffect(() => {
    if (orders.length > 0 && !loading) {
      // Only refresh if we already have orders loaded (not on initial mount)
      loadOrders(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadOrders = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');
      const data = await apiClient.getBusinessOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const dailyOrders = useMemo(() => {
    // Backend returns orderDate as YYYY-MM-DD (local timezone)
    // Extract just the date part if it includes time, otherwise use as-is
    return orders.filter((order) => {
      const orderDateOnly = order.orderDate.includes('T') 
        ? order.orderDate.split('T')[0] 
        : order.orderDate;
      return orderDateOnly === selectedDate;
    });
  }, [orders, selectedDate]);

  const packSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        packName: string;
        packPrice: number;
        count: number;
        orders: OrderDto[];
        variantBreakdown: Record<string, Record<string, number>>;
      }
    > = {};

    dailyOrders.forEach((order) => {
      if (!summary[order.packId]) {
        const packPrice = typeof order.packPrice === 'string' ? parseFloat(order.packPrice) : (order.packPrice || 0);
        summary[order.packId] = {
          packName: order.packName,
          packPrice: isNaN(packPrice) ? 0 : packPrice,
          count: 0,
          orders: [],
          variantBreakdown: {},
        };
      }
      summary[order.packId].count++;
      summary[order.packId].orders.push(order);

      order.items.forEach((item) => {
        if (!summary[order.packId].variantBreakdown[item.componentName]) {
          summary[order.packId].variantBreakdown[item.componentName] = {};
        }
        const variantCount =
          summary[order.packId].variantBreakdown[item.componentName][
            item.variantName
          ] || 0;
        summary[order.packId].variantBreakdown[item.componentName][
          item.variantName
        ] = variantCount + 1;
      });
    });

    return Object.values(summary);
  }, [dailyOrders]);

  // Calculate stats
  const totalOrdersToday = dailyOrders.length;
  const totalCostToday = dailyOrders.reduce((sum, order) => {
    const amount = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : (order.totalAmount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const uniqueEmployees = new Set(dailyOrders.map(order => order.employeeId)).size;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Date Selector Tabs */}
      <div className="mb-6">
        <div className="bg-surface border border-surface-dark rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard.todaysOrders')}</h1>
            <div className="text-lg font-semibold text-gray-700">
              {formatFullDate(selectedDate)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadOrders(true)}
              disabled={refreshing || loading}
              className="px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title={t('dashboard.refreshData')}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('common.buttons.refresh')}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2 rounded-lg font-medium bg-surface-light text-gray-700 hover:bg-surface-dark transition-colors border-2 border-transparent"
              >
                {t('common.buttons.otherDate')}
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 left-0 bg-surface border border-surface-dark rounded-lg shadow-lg p-3 z-50">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    min={today}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <Error message={error} onRetry={loadOrders} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalOrders')}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{totalOrdersToday}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.totalCost')}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {totalCostToday.toLocaleString(i18n.language || 'fr', {
                  style: 'currency',
                  currency: 'TND',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('dashboard.activeEmployees')}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{uniqueEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary Section */}
      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message={t('dashboard.loadingOrders')} />
        </div>
      ) : dailyOrders.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message={t('dashboard.noOrdersFound')}
            description={t('dashboard.noOrdersForDate', { date: formatFullDate(selectedDate) })}
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('dashboard.packSummary')}</h2>
          <div className="space-y-4">
            {packSummary.map((pack) => (
              <Card key={pack.packName} className="bg-surface border border-surface-dark rounded-lg hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pack.packName}</h3>
                      <p className="text-sm text-gray-600">
                        {(typeof pack.packPrice === 'string' ? parseFloat(pack.packPrice) : pack.packPrice || 0).toFixed(2)} TND {t('common.labels.perPack')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-gray-900">{pack.count}</div>
                      <div className="text-sm text-gray-600">{t('common.labels.orders')}</div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedPack(expandedPack === pack.packName ? null : pack.packName)
                    }
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {expandedPack === pack.packName ? t('common.labels.hideVariantBreakdown') : t('common.labels.showVariantBreakdown')}
                  </button>
                  {expandedPack === pack.packName && (
                    <div className="mt-4 pt-4 border-t border-surface-dark">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        {t('common.labels.variantBreakdown')}:
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(pack.variantBreakdown).map(
                          ([componentName, variants]) => (
                            <div key={componentName} className="ml-4">
                              <div className="font-medium text-gray-700 text-sm mb-1">
                                {componentName}:
                              </div>
                              <div className="ml-4 space-y-1">
                                {Object.entries(variants).map(([variantName, count]) => (
                                  <div
                                    key={variantName}
                                    className="text-sm text-gray-600"
                                  >
                                    {variantName}: <strong>{count}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/employees" 
            className="bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{t('navigation.employees')}</h2>
            </div>
            <p className="text-gray-600">{t('dashboard.manageEmployeeAccounts')}</p>
          </Link>

          <Link 
            href="/orders" 
            className="bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{t('navigation.orders')}</h2>
            </div>
            <p className="text-gray-600">{t('dashboard.viewAllEmployeeOrders')}</p>
          </Link>

          <Link 
            href="/invoices" 
            className="bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{t('navigation.invoices')}</h2>
            </div>
            <p className="text-gray-600">{t('dashboard.viewAndManageInvoices')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
