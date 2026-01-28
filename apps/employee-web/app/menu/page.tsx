'use client';

import { useState, useEffect } from 'react';
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
import { CheckCircle, Clock, X, Package, AlertCircle } from 'lucide-react';
import { getTodayISO } from '../../lib/date-utils';

export default function MenuPage() {
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
        setError('Date mismatch detected. Please refresh the page.');
        return;
      }
      
      const menuData = await apiClient.getEmployeeMenu(today);
      setMenu(menuData);
      setPacks(menuData.packs);
    } catch (err: any) {
      if (err.message?.includes('past date') || err.message?.includes('read-only')) {
        setError('This menu is for a past date. Orders can only be placed for today\'s menu.');
      } else {
        setError(err.message || 'Failed to load menu');
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

  const totalAmount = selectedPack ? selectedPack.price : 0;

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
      setError('You have already placed an order for today. Only one order per day is allowed.');
      return;
    }

    if (!selectedPack || !isOrderValid || !menu) {
      setError('Please select a pack and all required components');
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
      const errorMessage = err.message || 'Failed to place order';
      if (
        errorMessage.includes('cutoff') ||
        errorMessage.includes('cut-off') ||
        errorMessage.includes('Ordering cutoff')
      ) {
        setError('Ordering cutoff time has passed. Orders cannot be placed after the cutoff time.');
      } else if (
        errorMessage.includes('already ordered') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('Conflict')
      ) {
        setError('You have already placed an order for this date. Only one order per day is allowed.');
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
          message: 'Confirmed - Ready for pickup',
          className: 'bg-success-50 border-success-300 text-success-700',
        };
      case OrderStatus.CREATED:
        return {
          icon: Clock,
          message: 'Pending confirmation',
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
                    <p className="font-semibold text-sm">Today's Order</p>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-white/50">
                      {todayOrder.status}
                    </span>
                  </div>
                  <p className="text-sm mb-3">{statusInfo.message}</p>
                  <button
                    onClick={() => router.push('/calendar')}
                    className="px-3 py-1.5 text-sm bg-white/50 hover:bg-white/70 rounded border font-medium transition-colors"
                  >
                    View Details
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
            <Loading message="Loading menu..." />
          </div>
        ) : packs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <Empty
              message="No packs available for today"
              description="Check back later or contact your business admin."
            />
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* Pack Selection - Inline Expansion */}
            {!selectedPack ? (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900 px-1">
                  Choose Your Pack
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
                              {pack.components.length} component{pack.components.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <p className="text-xl font-semibold text-primary-600 ml-4 flex-shrink-0">
                            {pack.price.toFixed(2)} TND
                          </p>
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
                      Change
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedPack.components.length} components • {selectedPack.price.toFixed(2)} TND
                  </p>
                </div>

                {/* Component Selection - Collapsible Sections */}
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-gray-900 px-1">
                    Customize Your Pack
                  </h2>
                  {sortedComponents.map((component) => {
                    const selectedVariantId = selections[component.id];
                    const selectedVariant = component.variants.find(
                      (v) => v.id === selectedVariantId
                    );
                    const hasSelection = !!selectedVariantId;
                    const isValid = !component.required || hasSelection;

                    return (
                      <CollapsibleSection
                        key={component.id}
                        title={component.name}
                        defaultOpen={!hasSelection}
                        headerClassName={!isValid ? 'border-l-4 border-destructive' : ''}
                        icon={
                          hasSelection ? (
                            <CheckCircle className="w-4 h-4 text-success-600" />
                          ) : component.required ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          ) : null
                        }
                      >
                        <Spotlight>
                          <div className="space-y-2 pt-2">
                            {component.variants.map((variant) => {
                              const isOutOfStock = variant.stockQuantity <= 0;
                              const isInactive = !variant.isActive;
                              const isDisabled = isOutOfStock || isInactive;
                              const isSelected = selectedVariantId === variant.id;

                              return (
                                <SpotLightItem key={variant.id} className="bg-background rounded">
                                  <button
                                    onClick={() =>
                                      !isDisabled && handleVariantSelect(component.id, variant.id)
                                    }
                                    disabled={isDisabled}
                                    className={`relative z-10 w-full text-left p-3 rounded transition-all min-h-[44px] ${
                                      isSelected
                                        ? 'border-2 border-primary-500 bg-primary-50'
                                        : 'border-2 border-surface-dark hover:border-primary-300'
                                    } ${
                                      isDisabled
                                        ? 'opacity-50 cursor-not-allowed bg-surface-light'
                                        : 'cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {variant.imageUrl ? (
                                        <img
                                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${variant.imageUrl}`}
                                          alt={variant.name}
                                          className="w-12 h-12 object-cover rounded-md border border-surface-dark flex-shrink-0"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                                          No image
                                        </div>
                                      )}
                                      <div className="flex-1 flex justify-between items-center">
                                        <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}>
                                          {variant.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {isOutOfStock && (
                                            <span className="text-xs text-destructive font-medium">Out of Stock</span>
                                          )}
                                          {!isOutOfStock && variant.stockQuantity < 10 && (
                                            <span className="text-xs text-warning-600 font-medium">
                                              {variant.stockQuantity} left
                                            </span>
                                          )}
                                          {isSelected && (
                                            <CheckCircle className="w-4 h-4 text-primary-600" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </SpotLightItem>
                              );
                            })}
                          </div>
                        </Spotlight>
                        {component.required && !selectedVariantId && (
                          <p className="text-xs text-destructive mt-2 font-medium">
                            Required - Please select an option
                          </p>
                        )}
                      </CollapsibleSection>
                    );
                  })}
                </div>

                {/* Inline Confirmation Panel */}
                {showConfirm && selectedPack && isOrderValid && (
                  <div className="bg-surface border-2 border-primary-500 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Confirm Your Order</h3>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-background rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pack:</span>
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
                            <p className="text-xs text-gray-600 font-normal">Ready at:</p>
                            <p className="text-sm font-semibold text-primary-700">
                              {readyTime.isToday
                                ? `Today at ${readyTime.timeStr}`
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

                    {/* Total */}
                    <div className="flex justify-between items-center pt-3 border-t border-surface-dark">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-semibold text-primary-600">
                        {totalAmount.toFixed(2)} TND
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 px-4 py-2.5 bg-surface-light text-gray-700 rounded-md hover:bg-surface-dark transition-colors font-semibold min-h-[44px]"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        {submitting ? 'Placing...' : 'Place Order'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Summary Bar - Always Visible When Pack Selected */}
                {!showConfirm && (
                  <div className="sticky bottom-0 bg-surface border-t-2 border-primary-500 shadow-lg rounded-t-lg">
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-xl font-semibold text-primary-600">
                          {totalAmount.toFixed(2)} TND
                        </span>
                      </div>
                      <button
                        onClick={handleConfirmClick}
                        disabled={!isOrderValid || submitting}
                        className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        {!isOrderValid
                          ? 'Complete Selection'
                          : 'Review & Confirm'}
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
