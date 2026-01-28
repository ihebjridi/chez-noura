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
  const [existingOrder, setExistingOrder] = useState<OrderDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Get date from query param or default to today
  const selectedDate = searchParams.get('date') || getTodayISO();
  const today = getTodayISO();

  useEffect(() => {
    // Validate that selectedDate is not in the past
    if (selectedDate < today) {
      // Redirect to today's date if past date is detected
      router.replace(`/new-order?date=${today}`);
      setError(t('menu.pastDateMenu'));
      return;
    }
    
    loadMenu();
    if (selectedDate === today) {
      checkExistingOrder();
    }
  }, [selectedDate]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      setSelectedPack(null);
      setSelections({});
      
      // Validate date is not in the past before making API call
      if (selectedDate < today) {
        setError(t('menu.pastDateMenu'));
        router.replace(`/new-order?date=${today}`);
        return;
      }
      
      const menuData = await apiClient.getEmployeeMenu(selectedDate);
      setMenu(menuData);
      setPacks(menuData.packs);
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

  const checkExistingOrder = async () => {
    try {
      const order = await apiClient.getTodayOrder();
      setExistingOrder(order);
    } catch (err) {
      // Silently fail - not critical
      setExistingOrder(null);
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

  // Calculate ready time
  const readyTime = menu?.cutoffTime
    ? (() => {
        const cutoffDate = new Date(menu.cutoffTime);
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
    if (existingOrder) {
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

      await apiClient.createEmployeeOrder({
        dailyMenuId: menu.id,
        packId: selectedPack.id,
        selectedVariants,
      });

      router.push(`/today?success=true`);
    } catch (err: any) {
      const errorMessage = err.message || t('common.messages.failedToPlaceOrder');
      if (
        errorMessage.includes('cutoff') ||
        errorMessage.includes('cut-off') ||
        errorMessage.includes('Ordering cutoff')
      ) {
        setError(t('common.messages.cutoffTimePassed'));
      } else if (
        errorMessage.includes('already ordered') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('Conflict')
      ) {
        setError(t('common.messages.alreadyOrderedDate'));
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">{t('newOrder.title')}</h1>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <p className="text-base font-medium text-gray-700">{formatDate(selectedDate)}</p>
        </div>
      </div>

      {/* Existing Order Warning */}
      {existingOrder && (
        <div className="mb-4 p-4 bg-warning-50 border border-warning-300 text-warning-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-semibold">
              {t('common.messages.alreadyOrderedDate')}
            </p>
          </div>
        </div>
      )}

      {/* Cutoff Countdown */}
      {menu?.cutoffTime && !existingOrder && (
        <div className="mb-4">
          <CutoffCountdown cutoffTime={menu.cutoffTime} />
        </div>
      )}

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

      {/* Menu Available */}
      {menu && !existingOrder && (
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
                    <Card key={pack.id} className="overflow-hidden hover:scale-[1.02] transition-transform duration-200">
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
                              <h3 className="text-xl font-bold text-black truncate">
                                {pack.name}
                              </h3>
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
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPack.name}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPack(null);
                      setSelections({});
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium min-h-[44px] px-2"
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
                        <div className="space-y-3 pt-3">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
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
                                className={`relative z-10 w-full text-left p-5 rounded-2xl transition-all duration-200 min-h-[80px] ${
                                  isSelected
                                    ? 'border-[3px] border-primary-600 bg-primary-50 shadow-lg scale-[1.02]'
                                    : 'border-2 border-gray-200 hover:border-primary-400 hover:bg-gray-50 hover:shadow-md'
                                } ${
                                  isDisabled
                                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                    : 'cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                    {variant.imageUrl ? (
                                    <img
                                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${variant.imageUrl}`}
                                      alt={variant.name}
                                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-gray-200 flex-shrink-0 shadow-sm"
                                    />
                                    ) : (
                                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 border-2 border-gray-200 rounded-2xl flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                                        {t('common.labels.noImage')}
                                      </div>
                                    )}
                                    <div className="flex-1 flex justify-between items-center min-w-0">
                                      <div className="flex-1 min-w-0">
                                        <span className={`block text-base ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                          {variant.name}
                                        </span>
                                        {isSelected && (
                                          <span className="text-xs text-primary-600 font-medium mt-1 block">
                                            {t('common.labels.selected')}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        {isOutOfStock && (
                                          <span className="px-2 py-1 text-xs text-destructive font-medium bg-destructive/10 rounded border border-destructive/20">
                                            {t('common.labels.outOfStock')}
                                          </span>
                                        )}
                                        {!isOutOfStock && variant.stockQuantity < 10 && (
                                          <span className="px-2 py-1 text-xs text-warning-700 font-medium bg-warning-50 rounded border border-warning-200">
                                            {variant.stockQuantity} {t('common.labels.left')}
                                          </span>
                                        )}
                                      {isSelected && (
                                        <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
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
              <div className="sticky bottom-0 bg-white border-t-2 border-primary-600 shadow-2xl rounded-t-3xl mt-8 mb-16 lg:mb-0">
                <div className="px-5 py-4">
                  {/* Ready Time Display */}
                  {readyTime && (
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-2xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t('common.labels.readyAt')}</p>
                          <p className="text-lg font-bold text-black">
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-lg rounded-2xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] min-h-[56px]"
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
