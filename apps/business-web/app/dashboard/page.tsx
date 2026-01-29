'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { OrderDto, OrderItemDto, BusinessServiceDto, BusinessDashboardSummaryDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { Card } from '../../components/ui/card';
import { Users, ShoppingCart, DollarSign, TrendingUp, RefreshCw, Package, CheckCircle2 } from 'lucide-react';
import { getTodayISO } from '../../lib/date-utils';
import { useBusinessServices } from '../../hooks/useBusinessServices';
import { useAuth } from '../../contexts/auth-context';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [summary, setSummary] = useState<BusinessDashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { businessServices, loadBusinessServices, loading: servicesLoading } = useBusinessServices();

  const today = getTodayISO();

  const formatFullDate = (dateString: string) => {
    // Parse YYYY-MM-DD as local calendar date to avoid timezone shifting the day
    const parts = dateString.split('-').map(Number);
    const date =
      parts.length === 3 && parts.every((n) => !Number.isNaN(n))
        ? new Date(parts[0], parts[1] - 1, parts[2])
        : new Date(dateString);
    const locale = i18n.language === 'en' ? 'en' : 'fr';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const loadDashboardSummary = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');
      const data = await apiClient.getDashboardSummary(selectedDate);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || t('common.messages.failedToLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardSummary(true);
    if (user?.businessId) {
      loadBusinessServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadBusinessServices]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardSummary(false);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardSummary(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh when selected date changes (after initial load)
  useEffect(() => {
    if (summary !== null && !loading) {
      loadDashboardSummary(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const dailyOrders = useMemo(() => summary?.orders ?? [], [summary]);

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

    dailyOrders.forEach((order: OrderDto) => {
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

      order.items.forEach((item: OrderItemDto) => {
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

  // Stats from dashboard summary (active employees = status ACTIVE, not from orders)
  const totalOrdersToday = summary?.totalOrders ?? 0;
  const totalCostToday = summary?.totalCost ?? 0;
  const activeEmployeesCount = summary?.activeEmployeesCount ?? 0;
  const totalOrdersAllTime = summary?.totalOrdersAllTime ?? 0;
  const totalCostAllTime = summary?.totalCostAllTime ?? 0;

  // Get active subscribed services
  const activeServices = useMemo(() => {
    return businessServices.filter((bs) => bs.isActive);
  }, [businessServices]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      {/* All Time Stats Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.allTimeStats')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/orders" className="block">
            <Card className="p-6 hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('dashboard.totalOrdersAllTime')}</p>
                  <p className="text-4xl font-bold text-black">{totalOrdersAllTime}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/invoices" className="block">
            <Card className="p-6 hover:border-accent-400 hover:bg-accent-50/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('dashboard.totalCostAllTime')}</p>
                  <p className="text-4xl font-bold text-black">
                    {totalCostAllTime.toLocaleString(i18n.language || 'fr', {
                      style: 'currency',
                      currency: 'TND',
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/employees" className="block">
            <Card className="p-6 hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('dashboard.activeEmployees')}</p>
                  <p className="text-4xl font-bold text-black">{activeEmployeesCount}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Date Selector Tabs */}
      <div className="mb-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-black">{t('dashboard.todaysOrders')}</h1>
            <div className="text-lg font-bold text-gray-800">
              {formatFullDate(selectedDate)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboardSummary(true)}
              disabled={refreshing || loading}
              className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              title={t('dashboard.refreshData')}
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('common.buttons.refresh')}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-5 py-2.5 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-primary-300 shadow-sm hover:shadow-md"
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
                    max={today}
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
          <Error message={error} onRetry={() => loadDashboardSummary(true)} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/orders" className="block">
          <Card className="p-6 hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('dashboard.totalOrders')}</p>
                <p className="text-4xl font-bold text-black">{totalOrdersToday}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/invoices" className="block">
          <Card className="p-6 hover:border-accent-400 hover:bg-accent-50/50 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('dashboard.totalCost')}</p>
                <p className="text-4xl font-bold text-black">
                  {totalCostToday.toLocaleString(i18n.language || 'fr', {
                    style: 'currency',
                    currency: 'TND',
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </Card>
        </Link>
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
              <Card key={pack.packName} className="hover:scale-[1.02] transition-transform duration-200">
                <div className="p-5">
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

      {/* Subscribed Services */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.subscribedServices')}</h2>
        {servicesLoading ? (
          <div className="bg-surface border border-surface-dark rounded-lg p-12">
            <Loading message={t('dashboard.loadingServices')} />
          </div>
        ) : activeServices.length === 0 ? (
          <div className="bg-surface border border-surface-dark rounded-lg p-12">
            <Empty
              message={t('dashboard.noSubscribedServices')}
              description={t('dashboard.noSubscribedServicesDescription')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((businessService) => (
              <Card key={businessService.id} className="hover:scale-[1.02] transition-transform duration-200">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{businessService.serviceName}</h3>
                        {businessService.serviceDescription && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{businessService.serviceDescription}</p>
                        )}
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {businessService.packs.filter((p) => p.isActive).length === 1
                        ? t('services.packsActivated', { count: 1 })
                        : t('services.packsActivated_plural', { count: businessService.packs.filter((p) => p.isActive).length })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            href="/employees" 
            className="bg-white border-2 border-gray-200 rounded-2xl hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200 cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-black group-hover:text-primary-600 transition-colors">{t('navigation.employees')}</h2>
            </div>
            <p className="text-gray-600 font-medium">{t('dashboard.manageEmployeeAccounts')}</p>
          </Link>

          <Link 
            href="/services" 
            className="bg-white border-2 border-gray-200 rounded-2xl hover:border-green-400 hover:bg-green-50/50 transition-all duration-200 cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-black group-hover:text-green-600 transition-colors">{t('navigation.services')}</h2>
            </div>
            <p className="text-gray-600 font-medium">{t('dashboard.manageServices')}</p>
          </Link>

          <Link 
            href="/orders" 
            className="bg-white border-2 border-gray-200 rounded-2xl hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200 cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-black group-hover:text-primary-600 transition-colors">{t('navigation.orders')}</h2>
            </div>
            <p className="text-gray-600 font-medium">{t('dashboard.viewAllEmployeeOrders')}</p>
          </Link>

          <Link 
            href="/invoices" 
            className="bg-white border-2 border-gray-200 rounded-2xl hover:border-accent-400 hover:bg-accent-50/50 transition-all duration-200 cursor-pointer block p-6 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-black group-hover:text-accent-600 transition-colors">{t('navigation.invoices')}</h2>
            </div>
            <p className="text-gray-600 font-medium">{t('dashboard.viewAndManageInvoices')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
