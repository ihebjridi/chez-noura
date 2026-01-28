'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import {
  KitchenSummaryDto,
  KitchenBusinessSummaryDto,
  KitchenDetailedSummaryDto,
} from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { getTodayISO, normalizeDateString } from '../../lib/date-utils';

export default function KitchenPage() {
  const searchParams = useSearchParams();
  const [date, setDate] = useState(getTodayISO());
  const [summary, setSummary] = useState<KitchenSummaryDto | null>(null);
  const [businessSummary, setBusinessSummary] = useState<KitchenBusinessSummaryDto | null>(null);
  const [detailedSummary, setDetailedSummary] = useState<KitchenDetailedSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'chef' | 'summary' | 'business'>('chef');

  // Read date from URL search params on mount
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const normalizedDate = normalizeDateString(dateParam);
      setDate(normalizedDate);
    }
  }, [searchParams]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const normalizedDate = normalizeDateString(date);
      const data = await apiClient.getKitchenSummary(normalizedDate);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load kitchen summary');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const normalizedDate = normalizeDateString(date);
      const data = await apiClient.getKitchenBusinessSummary(normalizedDate);
      setBusinessSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load business summary');
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const normalizedDate = normalizeDateString(date);
      const data = await apiClient.getKitchenDetailedSummary(normalizedDate);
      setDetailedSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load detailed summary');
    } finally {
      setLoading(false);
    }
  };

  const handleLockDay = async () => {
    const normalizedDate = normalizeDateString(date);
    if (!confirm(`Close all orders for ${normalizedDate}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await apiClient.lockDay(normalizedDate);
      setError(`Orders for ${normalizedDate} closed successfully`);
      if (activeTab === 'chef') {
        await loadDetailedSummary();
      } else if (activeTab === 'summary') {
        await loadSummary();
      } else {
        await loadBusinessSummary();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to close orders');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'chef' | 'summary' | 'business') => {
    setActiveTab(tab);
    if (tab === 'chef' && !detailedSummary) {
      loadDetailedSummary();
    } else if (tab === 'summary' && !summary) {
      loadSummary();
    } else if (tab === 'business' && !businessSummary) {
      loadBusinessSummary();
    }
  };

  // Group variants by component for chef view
  const variantsByComponent = useMemo(() => {
    if (!detailedSummary) return {};
    
    const grouped: Record<string, typeof detailedSummary.variants> = {};
    for (const variant of detailedSummary.variants) {
      if (!grouped[variant.componentName]) {
        grouped[variant.componentName] = [];
      }
      grouped[variant.componentName].push(variant);
    }
    return grouped;
  }, [detailedSummary]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Kitchen Operations</h1>
        <p className="mt-1 text-sm text-gray-600 font-normal">View kitchen summaries and quantities</p>
      </div>

      <div className="bg-surface border border-surface-dark rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                const normalizedDate = normalizeDateString(e.target.value);
                setDate(normalizedDate);
                setSummary(null);
                setBusinessSummary(null);
                setDetailedSummary(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={
              activeTab === 'chef'
                ? loadDetailedSummary
                : activeTab === 'summary'
                ? loadSummary
                : loadBusinessSummary
            }
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load Summary'}
          </button>
          <button
            onClick={handleLockDay}
            disabled={loading}
            className="px-4 py-2 bg-warning-400 text-white font-medium rounded-lg hover:bg-warning-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Close Orders
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange('chef')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'chef'
                ? 'bg-primary-100 text-primary-900 border-2 border-primary-500'
                : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
            }`}
          >
            Chef View
          </button>
          <button
            onClick={() => handleTabChange('summary')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-primary-100 text-primary-900 border-2 border-primary-500'
                : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => handleTabChange('business')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'business'
                ? 'bg-primary-100 text-primary-900 border-2 border-primary-500'
                : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
            }`}
          >
            Business Breakdown
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {activeTab === 'chef' && detailedSummary && (
        <div className="space-y-6">
          {/* Variant Summary Section - Grouped by Component */}
          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cooking Quantities - {date}</h2>
            {detailedSummary.lockedAt && (
              <p className="text-sm text-gray-600 mb-4">
                Locked at: {new Date(detailedSummary.lockedAt).toLocaleString()}
              </p>
            )}
            <div className="mb-4 flex gap-6 text-sm">
              <p>
                <strong>Total Variants:</strong> {detailedSummary.totalVariants}
              </p>
              <p>
                <strong>Total Orders:</strong> {detailedSummary.totalOrders}
              </p>
            </div>
            
            {/* Group variants by component */}
            <div className="space-y-6">
              {Object.entries(variantsByComponent).map(([componentName, variants]) => (
                <div key={componentName} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                    {componentName}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-dark">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Variant
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-surface-dark">
                        {variants.map((variant) => (
                          <tr key={variant.variantId} className="hover:bg-surface-light">
                            <td className="px-4 py-3 text-sm text-gray-900">{variant.variantName}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right text-lg">
                              {variant.totalQuantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders List Section */}
          <div className="bg-surface border border-surface-dark rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Orders - {date}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {detailedSummary.totalOrders} order{detailedSummary.totalOrders !== 1 ? 's' : ''} to assemble
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-dark">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pack
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variants
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-surface-dark">
                  {detailedSummary.orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-surface-light">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {order.businessName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.packName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="space-y-1">
                          {order.variants.map((v, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{v.componentName}:</span> {v.variantName}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'summary' && summary && (
        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Kitchen Summary - {date}</h2>
          {summary.lockedAt && (
            <p className="text-sm text-gray-600 mb-4">
              Locked at: {new Date(summary.lockedAt).toLocaleString()}
            </p>
          )}
          <p className="mb-4">
            <strong>Total Variants:</strong> {summary.totalVariants}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-dark">
                {summary.variants.map((variant) => (
                  <tr key={variant.variantId} className="hover:bg-surface-light">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.packName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.componentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.variantName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{variant.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'business' && businessSummary && (
        <div className="bg-surface border border-surface-dark rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Business Breakdown - {date}</h2>
          {businessSummary.lockedAt && (
            <p className="text-sm text-gray-600 mb-4">
              Locked at: {new Date(businessSummary.lockedAt).toLocaleString()}
            </p>
          )}
          <p className="mb-4">
            <strong>Total Variants:</strong> {businessSummary.totalVariants}
          </p>
          <div className="space-y-4">
            {businessSummary.variants.map((variant) => (
              <div key={variant.variantId} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{variant.variantName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Pack:</strong> {variant.packName} | <strong>Component:</strong> {variant.componentName}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Total Quantity: <strong>{variant.totalQuantity}</strong>
                </p>
                <div>
                  <strong className="text-sm text-gray-700">By Business:</strong>
                  <ul className="mt-2 ml-6 list-disc space-y-1">
                    {variant.businesses.map((business) => (
                      <li key={business.businessId} className="text-sm text-gray-600">
                        {business.businessName}: {business.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!summary && !businessSummary && !detailedSummary && !loading && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No summary loaded"
            description="Select a date and click 'Load Summary' to view kitchen operations."
          />
        </div>
      )}

      {loading && (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading..." />
        </div>
      )}
    </div>
  );
}
