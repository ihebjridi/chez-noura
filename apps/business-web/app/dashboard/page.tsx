'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/api-client';
import { OrderDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { Spotlight, SpotLightItem } from '../../components/ui-layouts/spotlight-cards';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { getTodayISO } from '../../lib/date-utils';

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  const today = getTodayISO();

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getBusinessOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
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

  // Calculate stats
  const totalOrdersToday = dailyOrders.length;
  const totalCostToday = dailyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const uniqueEmployees = new Set(dailyOrders.map(order => order.employeeId)).size;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Date Selector Tabs */}
      <div className="mb-6">
        <div className="bg-surface border border-surface-dark rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Today's Orders</h1>
            <div className="text-lg font-semibold text-gray-700">
              {formatFullDate(selectedDate)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2 rounded-lg font-medium bg-surface-light text-gray-700 hover:bg-surface-dark transition-colors border-2 border-transparent"
              >
                Other Date
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
                    min={today}
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
          <Error message={error} onRetry={loadOrders} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{totalOrdersToday}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {totalCostToday.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'TND',
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">{uniqueEmployees}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Summary Section */}
      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading orders..." />
        </div>
      ) : dailyOrders.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No orders found"
            description={`No orders found for ${formatFullDate(selectedDate)}`}
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Pack Summary</h2>
          <Spotlight>
            <div className="space-y-4">
              {packSummary.map((pack) => (
                <SpotLightItem key={pack.packName} className="bg-surface border border-surface-dark rounded-lg">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{pack.packName}</h3>
                        <p className="text-sm text-gray-600">
                          {pack.packPrice.toFixed(2)} TND per pack
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-gray-900">{pack.count}</div>
                        <div className="text-sm text-gray-600">orders</div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedPack(expandedPack === pack.packName ? null : pack.packName)
                      }
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {expandedPack === pack.packName ? 'Hide' : 'Show'} Variant Breakdown
                    </button>
                    {expandedPack === pack.packName && (
                      <div className="mt-4 pt-4 border-t border-surface-dark">
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
                </SpotLightItem>
              ))}
            </div>
          </Spotlight>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <Spotlight>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SpotLightItem className="bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-sm transition-all">
              <Link href="/employees" className="block p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
                </div>
                <p className="text-gray-600">Manage employee accounts</p>
              </Link>
            </SpotLightItem>

            <SpotLightItem className="bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-sm transition-all">
              <Link href="/orders" className="block p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
                </div>
                <p className="text-gray-600">View all employee orders</p>
              </Link>
            </SpotLightItem>

            <SpotLightItem className="bg-surface border border-surface-dark rounded-lg hover:border-primary-300 hover:shadow-sm transition-all">
              <Link href="/invoices" className="block p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
                </div>
                <p className="text-gray-600">View and manage invoices</p>
              </Link>
            </SpotLightItem>
          </div>
        </Spotlight>
      </div>
    </div>
  );
}
