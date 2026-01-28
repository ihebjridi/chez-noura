'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import {
  AvailablePackDto,
  UserRole,
  OrderDto,
  OrderStatus,
  EmployeeMenuDto,
} from '@contracts/core';
import { DegradedModeBanner } from '../../components/degraded-mode-banner';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { Spotlight, SpotLightItem } from '../../components/ui-layouts/spotlight-cards';
import { CutoffCountdown } from '../../components/cutoff-countdown';
import { EmployeeLayout } from '../../components/layouts/EmployeeLayout';
import { CollapsibleSection } from '../../components/layouts/CollapsibleSection';
import { CheckCircle, Clock, X, Package, AlertCircle, ChevronRight } from 'lucide-react';
import { getTodayISO } from '../../lib/date-utils';

export default function MenuPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState<EmployeeMenuDto | null>(null);
  const [packs, setPacks] = useState<AvailablePackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPack, setSelectedPack] = useState<AvailablePackDto | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [todayOrder, setTodayOrder] = useState<OrderDto | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [today] = useState(() => getTodayISO());

  useEffect(() => {
    loadMenu();
    checkTodayOrder();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Ensure we're always using today's date (defense against any date manipulation)
      const currentToday = getTodayISO();
      if (today !== currentToday) {
        // If the today constant is outdated, use current date
        setError(t('common.messages.dateMismatch'));
        return;
      }
      
      const menuData = await apiClient.getEmployeeMenu(today);
      setMenu(menuData);
      setPacks(menuData.packs);
    } catch (err: any) {
      if (err.message?.includes('past date') || err.message?.includes('read-only')) {
        setError(t('menu.pastDateMenu'));
      } else {
        setError(err.message || t('menu.failedToLoadMenu'));
      }
    } finally {
      setLoading(false);
    }
  };

  const checkTodayOrder = async () => {
    try {
      const todayOrderData = await apiClient.getTodayOrder();
      setTodayOrder(todayOrderData);
    } catch (err) {
      // Silently fail - not critical
      console.error('Failed to check today order:', err);
    }
  };

  const handlePackSelect = (pack: AvailablePackDto) => {
    setSelectedPack(pack);
    setSelections({});
    setShowConfirm(false);
    setError('');
  };

  const handleVariantSelect = (componentId: string, variantId: string) => {
    setSelections((prev) => ({
      ...prev,
      [componentId]: variantId,
    }));
    setShowConfirm(false);
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
        const timeStr = readyDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return { date: readyDate, isToday, timeStr };
      })()
    : null;

  const handleConfirmClick = () => {
    if (todayOrder) {
      setError(t('common.messages.alreadyOrderedToday'));
      return;
    }

    if (!selectedPack || !isOrderValid || !menu) {
      setError(t('common.messages.selectPackAndComponents'));
      return;
    }

    setShowConfirm(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPack || !isOrderValid || !menu) {
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

      router.push('/calendar?success=true');
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

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.LOCKED:
        return {
          icon: CheckCircle,
          message: t('menu.confirmedReadyPickup'),
          className: 'bg-success-50 border-success-300 text-success-700',
        };
      case OrderStatus.CREATED:
        return {
          icon: Clock,
          message: t('menu.pendingConfirmation'),
          className: 'bg-warning-50 border-warning-300 text-warning-800',
        };
      default:
        return {
          icon: AlertCircle,
          message: status,
          className: 'bg-secondary-100 border-secondary-300 text-secondary-700',
        };
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <EmployeeLayout>
        <DegradedModeBanner />

        {/* Today's Order Status - Prominent Display */}
        {todayOrder && (() => {
          const statusInfo = getStatusInfo(todayOrder.status);
          const StatusIcon = statusInfo.icon;
          return (
            <div className={`mx-4 mt-4 p-4 rounded-lg border ${statusInfo.className}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{t('menu.todaysOrder')}</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-white/50">
                      {todayOrder.status}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{statusInfo.message}</p>
                  <button
                    onClick={() => router.push('/calendar')}
                    className="px-3 py-1.5 text-sm bg-white/50 hover:bg-white/70 rounded border font-medium transition-colors"
                  >
                    {t('common.buttons.viewDetails')}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Cutoff Countdown - Critical Information */}
        {menu?.cutoffTime && !todayOrder && (
          <CutoffCountdown cutoffTime={menu.cutoffTime} />
        )}

        {/* Error Display */}
        {error && !loading && (
          <div className="mx-4 mt-4">
            <Error message={error} />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loading message={t('menu.failedToLoadMenu')} />
          </div>
        ) : packs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <Empty
              message={t('menu.noMenu')}
              description={t('today.checkBackLater')}
            />
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* Pack Selection - Inline Expansion */}
            {!selectedPack ? (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900 px-1">
                  {t('menu.selectPack')}
                </h2>
                <Spotlight>
                  {packs.map((pack) => (
                    <SpotLightItem key={pack.id} className="bg-surface border border-surface-dark rounded-lg">
                      <button
                        onClick={() => handlePackSelect(pack)}
                        className="relative z-10 w-full p-4 text-left hover:bg-surface-light transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="w-4 h-4 text-primary-600 flex-shrink-0" />
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {pack.name}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              {pack.components.length} {pack.components.length !== 1 ? t('common.labels.items') : t('common.labels.item')}
                            </p>
                            <p className="text-xs text-primary-600 mt-1 font-medium flex items-center gap-1">
                              {t('common.buttons.customize')}
                              <ChevronRight className="w-3 h-3" />
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                        </div>
                      </button>
                    </SpotLightItem>
                  ))}
                </Spotlight>
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
                        setShowConfirm(false);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {t('common.labels.change')}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedPack.components.length} {selectedPack.components.length !== 1 ? t('common.labels.items') : t('common.labels.item')}
                  </p>
                </div>

                {/* Component Selection - Collapsible Sections */}
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
                                  className={`relative z-10 w-full text-left p-4 rounded-lg transition-all min-h-[60px] ${
                                    isSelected
                                      ? 'border-2 border-primary-500 bg-primary-50 shadow-sm'
                                      : 'border border-surface-dark hover:border-primary-300 hover:bg-surface-light'
                                  } ${
                                    isDisabled
                                      ? 'opacity-50 cursor-not-allowed bg-surface-light'
                                      : 'cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    {variant.imageUrl ? (
                                      <img
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${variant.imageUrl}`}
                                        alt={variant.name}
                                        className="w-16 h-16 object-cover rounded-lg border-2 border-surface-dark flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-surface-light border-2 border-surface-dark rounded-lg flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
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

                {/* Inline Confirmation Panel */}
                {showConfirm && selectedPack && isOrderValid && (
                  <div className="bg-surface border-2 border-primary-500 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{t('menu.confirmOrder')}</h3>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-background rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('common.labels.pack')}:</span>
                        <span className="font-medium text-gray-900">{selectedPack.name}</span>
                      </div>
                      {sortedComponents.map((component) => {
                        const selectedVariant = component.variants.find(
                          (v) => v.id === selections[component.id]
                        );
                        return (
                          selectedVariant && (
                            <div key={component.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">{component.name}:</span>
                              <span className="font-medium text-gray-900">{selectedVariant.name}</span>
                            </div>
                          )
                        );
                      })}
                    </div>

                    {/* Ready Time Display */}
                    {readyTime && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary-600" />
                          <div>
                            <p className="text-xs text-gray-600 font-normal">{t('common.labels.readyAt')}:</p>
                            <p className="text-sm font-semibold text-primary-700">
                              {readyTime.isToday
                                ? `${t('common.labels.today')} ${readyTime.timeStr}`
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


                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 px-4 py-2.5 bg-surface-light text-gray-700 rounded-md hover:bg-surface-dark transition-colors font-semibold min-h-[44px]"
                      >
                        {t('common.buttons.back')}
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        {submitting ? t('newOrder.placingOrder') : t('common.buttons.placeOrder')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Summary Bar - Always Visible When Pack Selected */}
                {!showConfirm && (
                  <div className="sticky bottom-0 bg-surface border-t-2 border-primary-500 shadow-lg rounded-t-lg">
                    <div className="px-4 py-3">
                      <button
                        onClick={handleConfirmClick}
                        disabled={!isOrderValid || submitting}
                        className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        {!isOrderValid
                          ? t('common.labels.completeSelection')
                          : t('common.labels.reviewConfirm')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </EmployeeLayout>
    </ProtectedRoute>
  );
}
