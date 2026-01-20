'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { MealDto, UserRole, OrderDto, OrderStatus, EntityStatus } from '@contracts/core';
import { DegradedModeBanner } from '../../components/degraded-mode-banner';
import { Logo } from '../../components/logo';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';

export default function MenuPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<MealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMeals, setSelectedMeals] = useState<Record<string, number>>({});
  const [todayOrder, setTodayOrder] = useState<OrderDto | null>(null);
  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMeals();
    checkTodayOrder();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getMealsForDate(today);
      // Filter only active meals
      const activeMeals = data.filter(
        (meal) => meal.isActive && meal.status === EntityStatus.ACTIVE,
      );
      setMeals(activeMeals);
    } catch (err: any) {
      setError(err.message || 'Failed to load meals');
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

  const handleQuantityChange = (mealId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedMeals };
      delete newSelected[mealId];
      setSelectedMeals(newSelected);
    } else {
      setSelectedMeals({ ...selectedMeals, [mealId]: quantity });
    }
  };

  const totalAmount = meals.reduce((sum, meal) => {
    const quantity = selectedMeals[meal.id] || 0;
    return sum + meal.price * quantity;
  }, 0);

  const hasSelection = Object.keys(selectedMeals).length > 0;

  const handleProceed = () => {
    if (todayOrder) {
      setError('You have already placed an order for today. Only one order per day is allowed.');
      return;
    }

    const items = Object.entries(selectedMeals).map(([mealId, quantity]) => ({
      mealId,
      quantity,
    }));

    if (items.length === 0) {
      setError('Please select at least one meal');
      return;
    }

    router.push(`/order/confirm?date=${today}&items=${encodeURIComponent(JSON.stringify(items))}`);
  };

  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <DegradedModeBanner />
        
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">Today's Iftar Menu</h1>
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
          <Loading message="Loading menu..." />
        ) : meals.length === 0 ? (
          <Empty 
            message="No meals available for today"
            description="Check back later or contact your business admin."
          />
        ) : (
          <div className="px-4 py-4 space-y-4">
            {meals.map((meal) => {
              const quantity = selectedMeals[meal.id] || 0;
              return (
                <div
                  key={meal.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 md:p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                      {meal.name}
                    </h3>
                    {meal.description && (
                      <p className="text-sm md:text-base text-gray-600 mb-2">
                        {meal.description}
                      </p>
                    )}
                    <p className="text-xl md:text-2xl font-semibold text-primary-600">
                      {meal.price.toFixed(2)} TND
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleQuantityChange(meal.id, quantity - 1)}
                      disabled={quantity === 0}
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center text-lg md:text-xl font-medium transition-colors ${
                        quantity === 0
                          ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-lg md:text-xl">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(meal.id, quantity + 1)}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center text-lg md:text-xl font-medium transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fixed bottom bar for order summary - mobile only */}
        {hasSelection && !todayOrder && (
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
        {hasSelection && !todayOrder && (
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
