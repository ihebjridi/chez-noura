'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { AvailablePackDto, UserRole, OrderDto, OrderStatus } from '@contracts/core';
import { DegradedModeBanner } from '../../components/degraded-mode-banner';
import { Logo } from '../../components/logo';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';

export default function MenuPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [packs, setPacks] = useState<AvailablePackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPack, setSelectedPack] = useState<AvailablePackDto | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({}); // componentId -> variantId
  const [todayOrder, setTodayOrder] = useState<OrderDto | null>(null);
  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPacks();
    checkTodayOrder();
  }, []);

  const loadPacks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getAvailablePacks(today);
      setPacks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load packs');
    } finally {
      setLoading(false);
    }
  };

  const checkTodayOrder = async () => {
    try {
      const orders = await apiClient.getMyOrders();
      const todayOrderData = orders.find(
        (order) => order.orderDate === today && order.status !== OrderStatus.CANCELLED,
      );
      setTodayOrder(todayOrderData || null);
    } catch (err) {
      // Silently fail - not critical
      console.error('Failed to check today order:', err);
    }
  };

  const handlePackSelect = (pack: AvailablePackDto) => {
    setSelectedPack(pack);
    setSelections({});
  };

  const handleVariantSelect = (componentId: string, variantId: string) => {
    setSelections((prev) => ({
      ...prev,
      [componentId]: variantId,
    }));
  };

  const sortedComponents = selectedPack
    ? [...selectedPack.components].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const isOrderValid = selectedPack && sortedComponents.every(
    (component) => !component.required || selections[component.id]
  );

  const totalAmount = selectedPack ? selectedPack.price : 0;

  const handleProceed = () => {
    if (todayOrder) {
      setError('You have already placed an order for today. Only one order per day is allowed.');
      return;
    }

    if (!selectedPack || !isOrderValid) {
      setError('Please select a pack and all required components');
      return;
    }

    const items = Object.entries(selections).map(([componentId, variantId]) => ({
      componentId,
      variantId,
    }));

    router.push(
      `/order/confirm?date=${today}&packId=${selectedPack.id}&items=${encodeURIComponent(JSON.stringify(items))}`
    );
  };

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <DegradedModeBanner />
        
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">Select Your Iftar Pack</h1>
                {user && (
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">{user.email}</p>
                )}
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {todayOrder && (
          <div className={`mx-4 mt-4 p-4 rounded-lg border ${
            todayOrder.status === OrderStatus.LOCKED
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <strong className="text-sm font-semibold">Today's Order Status:</strong>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                todayOrder.status === OrderStatus.LOCKED
                  ? 'bg-green-700 text-white'
                  : 'bg-yellow-700 text-white'
              }`}>
                {todayOrder.status}
              </span>
            </div>
            <p className="text-xs md:text-sm mb-3">
              {todayOrder.status === OrderStatus.LOCKED
                ? 'Your order has been locked and confirmed.'
                : 'Your order has been placed and is pending confirmation.'}
            </p>
            <button
              onClick={() => router.push('/orders')}
              className={`text-xs md:text-sm px-3 py-1.5 rounded border font-medium transition-colors ${
                todayOrder.status === OrderStatus.LOCKED
                  ? 'border-green-700 text-green-700 hover:bg-green-100'
                  : 'border-yellow-700 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              View Order Details
            </button>
          </div>
        )}

        {error && !loading && (
          <div className="mx-4 mt-4">
            <Error message={error} />
          </div>
        )}

        {loading ? (
          <Loading message="Loading packs..." />
        ) : packs.length === 0 ? (
          <Empty 
            message="No packs available for today"
            description="Check back later or contact your business admin."
          />
        ) : !selectedPack ? (
          <div className="px-4 py-4 space-y-4">
            {packs.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handlePackSelect(pack)}
                className="w-full bg-white rounded-lg border-2 border-gray-200 p-4 md:p-6 text-left hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                      {pack.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pack.components.length} component{pack.components.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-primary-600">
                    {pack.price.toFixed(2)} TND
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPack.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPack.price.toFixed(2)} TND</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPack(null);
                    setSelections({});
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Change Pack
                </button>
              </div>

              <div className="space-y-4">
                {sortedComponents.map((component) => {
                  const selectedVariantId = selections[component.id];
                  return (
                    <div key={component.id} className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {component.name}
                        {component.required && <span className="text-red-600 ml-1">*</span>}
                      </h4>
                      <div className="space-y-2">
                        {component.variants.map((variant) => {
                          const isOutOfStock = variant.stockQuantity <= 0;
                          const isInactive = !variant.isActive;
                          const isDisabled = isOutOfStock || isInactive;
                          const isSelected = selectedVariantId === variant.id;

                          return (
                            <button
                              key={variant.id}
                              onClick={() => !isDisabled && handleVariantSelect(component.id, variant.id)}
                              disabled={isDisabled}
                              className={`w-full text-left p-3 rounded border-2 transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              } ${
                                isDisabled
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                  : 'cursor-pointer'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className={isSelected ? 'font-medium' : ''}>
                                  {variant.name}
                                </span>
                                {isOutOfStock && (
                                  <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                                )}
                                {!isOutOfStock && variant.stockQuantity < 10 && (
                                  <span className="text-xs text-yellow-600 font-medium">
                                    {variant.stockQuantity} left
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {component.required && !selectedVariantId && (
                        <p className="text-xs text-red-600 mt-2">
                          Please select a variant for this required component
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Fixed bottom bar for order summary - mobile only */}
        {selectedPack && isOrderValid && !todayOrder && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 md:hidden">
            <div className="px-4 py-3">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-primary-600">
                  {totalAmount.toFixed(2)} TND
                </span>
              </div>
              <button
                onClick={handleProceed}
                className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Review Order
              </button>
            </div>
          </div>
        )}

        {/* Desktop order summary */}
        {selectedPack && isOrderValid && !todayOrder && (
          <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="ml-2 text-2xl font-bold text-primary-600">
                    {totalAmount.toFixed(2)} TND
                  </span>
                </div>
                <button
                  onClick={handleProceed}
                  className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  Review Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
