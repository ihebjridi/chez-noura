'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { Spotlight, SpotLightItem } from '../../../components/ui-layouts/spotlight-cards';
import { CutoffCountdown } from '../../../components/cutoff-countdown';
import { CollapsibleSection } from '../../../components/layouts/CollapsibleSection';
import { CheckCircle, Clock, Package, AlertCircle, Calendar } from 'lucide-react';
import { getTodayISO, getTomorrowISO } from '../../../lib/date-utils';

function NewOrderContent() {
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
      setError('This menu is for a past date. Orders can only be placed for today\'s menu.');
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
        setError('This menu is for a past date. Orders can only be placed for today\'s menu.');
        router.replace(`/new-order?date=${today}`);
        return;
      }
      
      const menuData = await apiClient.getEmployeeMenu(selectedDate);
      setMenu(menuData);
      setPacks(menuData.packs);
    } catch (err: any) {
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        setError('Menu not available for this date');
      } else if (err.message?.includes('past date') || err.message?.includes('read-only')) {
        setError('This menu is for a past date. Orders can only be placed for today\'s menu.');
        // Redirect to today if backend rejects past date
        router.replace(`/new-order?date=${today}`);
      } else {
        setError(err.message || 'Failed to load menu');
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

  const handlePlaceOrder = async () => {
    if (existingOrder) {
      setError('You have already placed an order for this date. Only one order per day is allowed.');
      return;
    }

    if (!selectedPack || !isOrderValid || !menu) {
      setError('Please select a pack and all required components');
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = getTodayISO();
    const tomorrow = getTomorrowISO();

    if (dateStr === today) {
      return 'Today';
    } else if (dateStr === tomorrow) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading message="Loading menu..." />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <div className="flex items-center gap-2 mt-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
        </div>
      </div>

      {/* Existing Order Warning */}
      {existingOrder && (
        <div className="mb-4 p-4 bg-warning-50 border border-warning-300 text-warning-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-semibold">
              You have already placed an order for this date. Only one order per day is allowed.
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
              message="Menu not available"
              description="No menu is available for the selected date. Please choose a different date."
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
                Choose Your Pack
              </h2>
              {packs.length === 0 ? (
                <div className="bg-surface border border-surface-dark rounded-lg p-6">
                  <Empty
                    message="No packs available"
                    description="No packs are available for this date."
                  />
                </div>
              ) : (
                <Spotlight>
                  {packs.map((pack) => (
                    <SpotLightItem key={pack.id} className="bg-surface border border-surface-dark rounded-lg">
                      <button
                        onClick={() => handlePackSelect(pack)}
                        className="relative z-10 w-full p-4 text-left hover:bg-surface-light transition-colors cursor-pointer min-h-[44px]"
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
                    Change
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedPack.components.length} components • {selectedPack.price.toFixed(2)} TND
                </p>
              </div>

              {/* Component Selection */}
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

              {/* Sticky Bottom Bar */}
              <div className="sticky bottom-0 bg-surface border-t-2 border-primary-500 shadow-lg rounded-t-lg mt-6">
                <div className="px-4 py-3">
                  {/* Ready Time Display */}
                  {readyTime && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-3">
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

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-xl font-semibold text-primary-600">
                      {totalAmount.toFixed(2)} TND
                    </span>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!isOrderValid || submitting}
                    className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {submitting
                      ? 'Placing Order...'
                      : !isOrderValid
                        ? 'Complete Selection'
                        : 'Confirm My Meal'}
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

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loading message="Loading..." />
        </div>
      }
    >
      <NewOrderContent />
    </Suspense>
  );
}
