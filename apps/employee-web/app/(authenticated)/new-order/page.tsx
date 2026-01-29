'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  AvailablePackDto,
  OrderDto,
  EmployeeMenuDto,
} from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Empty } from '../../../components/ui/empty';
import { Error } from '../../../components/ui/error';
import { Card } from '../../../components/ui/card';
import { CutoffCountdown } from '../../../components/cutoff-countdown';
import { CollapsibleSection } from '../../../components/layouts/CollapsibleSection';
import { CheckCircle, Clock, Package, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { getTodayISO, getTomorrowISO } from '../../../lib/date-utils';
import { getLatestServiceCutoff } from '../../../lib/service-window-utils';

function NewOrderContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menu, setMenu] = useState<EmployeeMenuDto | null>(null);
  const [packs, setPacks] = useState<AvailablePackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPack, setSelectedPack] = useState<AvailablePackDto | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [existingOrders, setExistingOrders] = useState<OrderDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Get date from query param or default to today
  const selectedDate = searchParams.get('date') || getTodayISO();
  const today = getTodayISO();

  useEffect(() => {
    // Validate that selectedDate is not in the past
    if (selectedDate < today) {
      router.replace(`/new-order?date=${today}`);
      setError(t('menu.pastDateMenu'));
      return;
    }
    
    // Load data: existing orders first (for today), then menu
    const loadData = async () => {
      if (selectedDate === today) {
        const orders = await checkExistingOrders();
        await loadMenu(orders);
      } else {
        await loadMenu();
      }
    };
    
    loadData();
  }, [selectedDate]);

  const loadMenu = async (ordersToUse?: OrderDto[]) => {
    try {
      setLoading(true);
      setError('');
      setSelectedPack(null);
      setSelections({});
      
      // Validate date is not in the past
      if (selectedDate < today) {
        setError(t('menu.pastDateMenu'));
        router.replace(`/new-order?date=${today}`);
        return;
      }
      
      const menuData = await apiClient.getEmployeeMenu(selectedDate);
      const orders = ordersToUse ?? existingOrders;
      
      // Get service IDs that already have orders
      const orderedServiceIds = new Set(
        orders
          .map((order) => order.serviceId)
          .filter((id): id is string => !!id)
      );
      
      // Filter packs: only show packs for services without orders
      const availablePacks = menuData.packs.filter((pack) => {
        if (!pack.serviceId) {
          // Legacy pack: only show if no orders exist
          return orders.length === 0;
        }
        // Service pack: only show if service doesn't have an order
        return !orderedServiceIds.has(pack.serviceId);
      });
      
      setMenu(menuData);
      setPacks(availablePacks);
    } catch (err: any) {
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        setError(t('common.messages.menuNotAvailableDate'));
      } else if (err.message?.includes('past date') || err.message?.includes('read-only')) {
        setError(t('menu.pastDateMenu'));
        // Redirect to today if backend rejects past date
        router.replace(`/new-order?date=${today}`);
      } else {
        setError(err.message || t('menu.failedToLoadMenu'));
      }
      setMenu(null);
      setPacks([]);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingOrders = async () => {
    try {
      const orders = await apiClient.getTodayOrders();
      setExistingOrders(orders);
      return orders;
    } catch (err) {
      // Silently fail - not critical
      setExistingOrders([]);
      return [];
    }
  };

  const handlePackSelect = (pack: AvailablePackDto) => {
    setSelectedPack(pack);
    setSelections({});
    setError('');
  };

  const handleVariantSelect = (componentId: string, variantId: string) => {
    setSelections((prev) => ({
      ...prev,
      [componentId]: variantId,
    }));
    setError('');
  };

  const sortedComponents = selectedPack
    ? [...selectedPack.components].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const isOrderValid = selectedPack && sortedComponents.every(
    (component) => !component.required || selections[component.id]
  );

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

  const handlePlaceOrder = async () => {
    // Check if user already ordered from this pack's service
    if (selectedPack?.serviceId) {
      const hasOrderForService = existingOrders.some(
        (order) => order.serviceId === selectedPack.serviceId
      );
      if (hasOrderForService) {
        const serviceName = selectedPack.serviceName || 'this service';
        setError(
          `You have already placed an order for ${serviceName} on this date. Only one order per service per day is allowed.`
        );
        return;
      }
    } else if (existingOrders.length > 0) {
      // Legacy pack without service - only allow one order per day
      setError(t('common.messages.alreadyOrderedDate'));
      return;
    }

    if (!selectedPack || !isOrderValid || !menu) {
      setError(t('common.messages.selectPackAndComponents'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const selectedVariants = Object.entries(selections).map(([componentId, variantId]) => ({
        componentId,
        variantId,
      }));

      const order = await apiClient.createEmployeeOrder({
        dailyMenuId: menu.id,
        packId: selectedPack.id,
        selectedVariants,
      });

      // Update existing orders and reload menu to get filtered packs
      const updatedOrders = [...existingOrders, order];
      setExistingOrders(updatedOrders);
      
      // Reload menu with updated orders to properly filter packs and service windows
      await loadMenu(updatedOrders);
      
      // Redirect to today page
      router.push(`/today?success=true`);
    } catch (err: any) {
      const errorMessage = err.message || t('common.messages.failedToPlaceOrder');
      if (
        errorMessage.includes('cutoff') ||
        errorMessage.includes('cut-off') ||
        errorMessage.includes('Ordering cutoff') ||
        errorMessage.includes('cutoff time')
      ) {
        setError(t('common.messages.cutoffTimePassed'));
      } else if (
        errorMessage.includes('starts at') ||
        errorMessage.includes('order start')
      ) {
        setError(errorMessage);
      } else if (
        errorMessage.includes('already ordered') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('Conflict')
      ) {
        setError(t('common.messages.alreadyOrderedDate'));
        // If order already exists, check for it to update state
        if (selectedDate === today) {
          checkExistingOrders();
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = getTodayISO();
    const tomorrow = getTomorrowISO();
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

    if (dateStr === today) {
      return t('common.labels.today');
    } else if (dateStr === tomorrow) {
      return t('common.labels.tomorrow');
    } else {
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading message={t('menu.failedToLoadMenu')} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">{t('newOrder.title')}</h1>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <p className="text-base font-medium text-gray-700">{formatDate(selectedDate)}</p>
        </div>
      </div>

      {/* Existing Orders Warning */}
      {existingOrders.length > 0 && (
        <div className="mb-4 p-4 bg-warning-50 border border-warning-300 text-warning-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-semibold">
              {existingOrders.length === 1
                ? `You have already placed an order for ${existingOrders[0].serviceName || 'today'}.`
                : `You have already placed ${existingOrders.length} orders for today.`}
            </p>
          </div>
        </div>
      )}

      {/* Cutoff Countdown – only show for services that still have available packs */}
      {menu && packs.length > 0 && (() => {
        // Get service IDs that still have available packs
        const availableServiceIds = new Set(
          packs
            .map((pack) => pack.serviceId)
            .filter((id): id is string => !!id)
        );
        
        // Filter service windows to only show those with available packs
        const relevantServiceWindows = menu.serviceWindows?.filter((sw) =>
          availableServiceIds.has(sw.serviceId)
        );
        
        if (relevantServiceWindows && relevantServiceWindows.length > 0) {
          return (
            <div className="mb-4 space-y-4">
              {relevantServiceWindows.map((sw) => (
                <CutoffCountdown
                  key={sw.serviceId}
                  cutoffTime={sw.cutoffTime}
                  label={sw.serviceName}
                />
              ))}
            </div>
          );
        } else if (menu.cutoffTime && availableServiceIds.size === 0) {
          // Legacy: show global cutoff if no service-specific windows
          return (
            <div className="mb-4">
              <CutoffCountdown cutoffTime={menu.cutoffTime} />
            </div>
          );
        }
        return null;
      })()}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Error message={error} />
        </div>
      )}

      {/* Menu Not Available */}
      {!menu && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-surface border border-surface-dark rounded-lg p-8 w-full max-w-md">
            <Empty
              message={t('menu.menuUnavailable')}
              description={t('common.messages.menuNotAvailableDate')}
            />
          </div>
        </div>
      )}

      {/* Menu Available - show if there are available packs */}
      {menu && packs.length > 0 && (
        <div className="space-y-4">
          {/* Pack Selection */}
          {!selectedPack ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900 px-1">
                {t('menu.selectPack')}
              </h2>
              {packs.length === 0 ? (
                <div className="bg-surface border border-surface-dark rounded-lg p-6">
                  <Empty
                    message={t('menu.noMenu')}
                    description={t('common.messages.menuNotAvailableDate')}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {packs.map((pack) => (
                    <Card key={pack.id} className="overflow-hidden transition-transform duration-200">
                      <button
                        onClick={() => handlePackSelect(pack)}
                        className="relative z-10 w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-primary-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-xl font-bold text-black truncate">
                                  {pack.name}
                                </h3>
                                {pack.serviceName && (
                                  <p className="text-sm text-gray-500 font-medium mt-0.5 truncate">
                                    {pack.serviceName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-base text-gray-600 mb-2">
                              {pack.components.length} {pack.components.length !== 1 ? t('common.labels.items') : t('common.labels.item')}
                            </p>
                            <p className="text-sm text-primary-600 font-semibold flex items-center gap-1">
                              {t('common.buttons.customize')}
                              <ChevronRight className="w-4 h-4" />
                            </p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Selected Pack Header */}
              <div className="bg-surface border border-surface-dark rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedPack.name}</h3>
                      {selectedPack.serviceName && (
                        <p className="text-sm text-gray-500 font-medium truncate">{selectedPack.serviceName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPack(null);
                      setSelections({});
                    }}
                    className="px-4 py-2 rounded-xl font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 border-2 border-transparent hover:border-primary-200 min-h-[44px]"
                  >
                    {t('common.labels.change')}
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedPack.components.length} {selectedPack.components.length !== 1 ? t('common.labels.items') : t('common.labels.item')}
                </p>
              </div>

              {/* Component Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 px-1">
                  {t('menu.selectVariant')}
                </h2>
                {sortedComponents.map((component, index) => {
                  const selectedVariantId = selections[component.id];
                  const selectedVariant = component.variants.find(
                    (v) => v.id === selectedVariantId
                  );
                  const hasSelection = !!selectedVariantId;
                  const isValid = !component.required || hasSelection;

                  return (
                    <div key={component.id} className={index > 0 ? 'pt-2' : ''}>
                      <CollapsibleSection
                        title={
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{component.name}</span>
                            {component.required && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full border border-destructive/20">
                                {t('common.labels.required')}
                              </span>
                            )}
                            {!component.required && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                {t('common.labels.optional')}
                              </span>
                            )}
                          </div>
                        }
                        defaultOpen={!hasSelection}
                        headerClassName={`${!isValid ? 'border-l-4 border-destructive' : ''} py-3`}
                        icon={
                          hasSelection ? (
                            <CheckCircle className="w-5 h-5 text-success-600" />
                          ) : component.required ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : null
                        }
                      >
                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t('menu.selectVariant')} {component.name}:
                          </p>
                          {component.variants.map((variant) => {
                            const isOutOfStock = variant.stockQuantity <= 0;
                            const isInactive = !variant.isActive;
                            const isDisabled = isOutOfStock || isInactive;
                            const isSelected = selectedVariantId === variant.id;

                            return (
                              <button
                                key={variant.id}
                                onClick={() =>
                                  !isDisabled && handleVariantSelect(component.id, variant.id)
                                }
                                disabled={isDisabled}
                                className={`relative z-10 w-full text-left p-3 rounded-xl transition-all duration-200 min-h-[64px] ${
                                  isSelected
                                    ? 'border-[2px] border-primary-600 bg-primary-50 shadow-md scale-[1.01]'
                                    : 'border border-gray-200 hover:border-primary-400 hover:bg-gray-50 hover:shadow-sm'
                                } ${
                                  isDisabled
                                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                    : 'cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                    {variant.imageUrl ? (
                                    <img
                                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${variant.imageUrl}`}
                                      alt={variant.name}
                                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-gray-200 flex-shrink-0 shadow-sm"
                                    />
                                    ) : (
                                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                                        {t('common.labels.noImage')}
                                      </div>
                                    )}
                                    <div className="flex-1 flex justify-between items-center min-w-0">
                                      <div className="flex-1 min-w-0">
                                        <span className={`block text-sm ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                          {variant.name}
                                        </span>
                                        {isSelected && (
                                          <span className="text-xs text-primary-600 font-medium mt-0.5 block">
                                            {t('common.labels.selected')}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                        {isOutOfStock && (
                                          <span className="px-1.5 py-0.5 text-xs text-destructive font-medium bg-destructive/10 rounded border border-destructive/20">
                                            {t('common.labels.outOfStock')}
                                          </span>
                                        )}
                                        {!isOutOfStock && variant.stockQuantity < 10 && (
                                          <span className="px-1.5 py-0.5 text-xs text-warning-700 font-medium bg-warning-50 rounded border border-warning-200">
                                            {variant.stockQuantity} {t('common.labels.left')}
                                          </span>
                                        )}
                                      {isSelected && (
                                        <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {component.required && !selectedVariantId && (
                          <p className="text-sm text-destructive mt-3 font-medium bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                            ⚠️ {t('common.labels.required')} - {t('menu.selectVariant')} {component.name}
                          </p>
                        )}
                      </CollapsibleSection>
                    </div>
                  );
                })}
              </div>

              {/* Sticky Bottom Bar */}
              <div className="sticky bottom-0 z-50 bg-white/50 backdrop-blur-xl border-t border-primary-600/30 shadow-lg rounded-t-xl mt-4 mb-16 lg:mb-0">
                <div className="px-3 py-2">
                  {/* Ready Time Display */}
                  {readyTime && (
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">{t('common.labels.readyAt')}</p>
                          <p className="text-sm font-bold text-black">
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

                  <button
                    onClick={handlePlaceOrder}
                    disabled={!isOrderValid || submitting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-base rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] min-h-[44px]"
                  >
                    {submitting
                      ? t('newOrder.placingOrder')
                      : !isOrderValid
                        ? t('common.labels.completeSelection')
                        : t('common.buttons.placeOrder')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loading message={t('common.messages.loading')} />
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewOrderContent />
    </Suspense>
  );
}
