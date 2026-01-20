'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '../../components/protected-route';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import { UserRole, OrderDto } from '@contracts/core';
import { Logo } from '../../components/logo';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBusinessOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const dailyOrders = useMemo(() => {
    return orders.filter(
      (order) => order.orderDate.split('T')[0] === selectedDate
    );
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
        summary[order.packId] = {
          packName: order.packName,
          packPrice: order.packPrice,
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

  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Logo />
              <div className="flex items-center gap-4">
                {user && (
                  <span className="text-sm text-gray-600">{user.email}</span>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Business Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage employees, orders, and invoices for your business</p>
          </div>

          {/* Daily Summary Section */}
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Summary</h2>
              <div className="flex items-center gap-4 mb-4">
                <label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date:
                </label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-gray-600">Loading orders...</p>
            ) : dailyOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No orders found for {new Date(selectedDate).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Total Orders: <strong>{dailyOrders.length}</strong>
                </div>
                {packSummary.map((pack) => (
                  <div
                    key={pack.packName}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{pack.packName}</h3>
                        <p className="text-sm text-gray-600">
                          {pack.packPrice.toFixed(2)} TND per pack
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{pack.count}</div>
                        <div className="text-sm text-gray-600">orders</div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedPack(expandedPack === pack.packName ? null : pack.packName)
                      }
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      {expandedPack === pack.packName ? 'Hide' : 'Show'} Variant Breakdown
                    </button>
                    {expandedPack === pack.packName && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Variant Breakdown:
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
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/employees"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
              </div>
              <p className="text-gray-600">Manage employee accounts</p>
            </Link>

            <Link
              href="/orders"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
              </div>
              <p className="text-gray-600">View all employee orders</p>
            </Link>

            <Link
              href="/invoices"
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
              </div>
              <p className="text-gray-600">View and manage invoices</p>
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
