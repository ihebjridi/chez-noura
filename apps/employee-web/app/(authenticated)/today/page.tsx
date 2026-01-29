'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { OrderDto, EmployeeMenuDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { Empty } from '../../../components/ui/empty';
import { CheckCircle, Clock, Package, ArrowRight } from 'lucide-react';
import { getTodayISO } from '../../../lib/date-utils';
import { getLatestServiceCutoff } from '../../../lib/service-window-utils';

export default function TodayPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [todayOrders, setTodayOrders] = useState<OrderDto[]>([]);
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

      const [ordersResult, menuResult] = await Promise.allSettled([
        apiClient.getTodayOrders().catch((err) => {
          console.warn('Failed to load today orders:', err);
          return [] as OrderDto[];
        }),
        apiClient.getEmployeeMenu(today).catch((err) => {
          if (err.message?.includes('404') || err.message?.includes('not found')) {
            return null;
          }
          console.warn('Failed to load menu:', err);
          return null;
        }),
      ]);

      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
      const menuData = menuResult.status === 'fulfilled' ? menuResult.value : null;

      setTodayOrders(orders);
      setMenu(menuData);
    } catch (err: any) {
      console.error('Failed to load today\'s data:', err);
      setError(err.message || t('common.messages.failedToLoadTodaysData'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.LOCKED:
        return {
          icon: CheckCircle,
          message: t('today.confirmedReadyPickup'),
          className: 'bg-success-50 border-success-300 text-success-700',
        };
      case OrderStatus.CREATED:
        return {
          icon: Clock,
          message: t('today.pendingConfirmation'),
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

  // Calculate ready time - use latest cutoff when multiple services exist
  const readyTime = menu
    ? (() => {
        // If multiple services, use the latest cutoff; otherwise use global cutoffTime
        const cutoffDate = menu.serviceWindows?.length
          ? getLatestServiceCutoff(menu)
          : menu.cutoffTime
            ? new Date(menu.cutoffTime)
            : null;
        
        if (!cutoffDate) return null;
        
        const readyDate = new Date(cutoffDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
        const now = new Date();
        const isToday = readyDate.toDateString() === now.toDateString();
        const locale = i18n.language || 'fr';
        const timeStr = readyDate.toLocaleTimeString(locale, {
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
        <Loading message={t('today.loadingTodaysOrder')} />
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">{t('today.title')}</h1>
        <p className="text-base text-gray-600 font-medium">
          {new Date().toLocaleDateString(i18n.language || 'fr', {
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
            <p className="text-sm font-semibold">{t('common.messages.orderPlacedSuccess')}</p>
          </div>
        </div>
      )}

      {/* Today's Orders */}
      {todayOrders.length > 0 ? (
        <div className="space-y-4">
          {/* Status Card (shared for all orders) */}
          {(() => {
            const firstOrder = todayOrders[0];
            const statusInfo = getStatusInfo(firstOrder.status);
            const StatusIcon = statusInfo.icon;
            return (
              <div className={`p-6 rounded-lg border ${statusInfo.className}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-base">
                        {todayOrders.length === 1
                          ? t('today.todaysOrder')
                          : t('today.todaysOrders', { count: todayOrders.length })}
                      </p>
                      <span className="px-3 py-1 rounded text-xs font-medium bg-white/50">
                        {firstOrder.status}
                      </span>
                    </div>
                    <p className="text-sm mb-4">{statusInfo.message}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Order cards */}
          {todayOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900 text-lg">{order.packName}</h3>
                {order.serviceName && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                    {order.serviceName}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {t('common.labels.yourSelection')}
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
                        {t('common.labels.noImage')}
                      </div>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">{item.componentName}:</span>{' '}
                      {item.variantName}
                    </p>
                  </div>
                ))}
              </div>

              {readyTime && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-600 font-normal">{t('common.labels.readyAt')}:</p>
                      <p className="text-sm font-semibold text-primary-700">
                        {readyTime.isToday
                          ? `${t('common.labels.today')} ${readyTime.timeStr}`
                          : readyTime.date.toLocaleDateString(i18n.language || 'fr', {
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
            </div>
          ))}

          {/* Order more (only if there are services the user hasn't ordered from) */}
          {menu?.packs && (() => {
            const orderedServiceIds = new Set(
              todayOrders.map((o) => o.serviceId).filter((id): id is string => !!id)
            );
            const hasPacksToOrder = menu.packs.some(
              (pack) => !pack.serviceId ? todayOrders.length === 0 : !orderedServiceIds.has(pack.serviceId)
            );
            return hasPacksToOrder ? (
              <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-6 text-center">
                <p className="text-sm text-gray-600 mb-4">{t('today.orderAnotherService')}</p>
                <button
                  onClick={() => router.push(`/new-order?date=${today}`)}
                  className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 min-h-[44px] inline-flex items-center gap-2"
                >
                  {t('common.buttons.orderNow')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : null;
          })()}

          <button
            onClick={() => router.push('/calendar')}
            className="w-full px-5 py-2.5 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-primary-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-h-[44px]"
          >
            {t('today.viewOrderHistory')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : menu ? (
        /* No Order, Menu Available */
        <div className="space-y-4">
          {menu.packs && menu.packs.length > 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-6 text-center">
              <Empty
                message={t('today.noOrderToday')}
                description={t('today.noOrderTodayDescription')}
              />
              <button
                onClick={() => router.push(`/new-order?date=${today}`)}
                className="mt-6 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 min-h-[44px] inline-flex items-center gap-2"
              >
                {t('common.buttons.orderNow')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-6 text-center">
              <Empty
                message={menu.status === 'PUBLISHED' ? t('today.menuPublishedNoPacks') : t('today.menuNotAvailableOrdering')}
                description={menu.status === 'PUBLISHED' ? t('today.contactBusinessAdmin') : `${t('today.menuStatus')}: ${menu.status}`}
              />
            </div>
          )}
        </div>
      ) : (
        /* No Menu Available */
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-md p-6 text-center">
          <Empty
            message={t('today.noMenuAvailableToday')}
            description={t('today.checkBackLater')}
          />
        </div>
      )}
    </div>
  );
}
