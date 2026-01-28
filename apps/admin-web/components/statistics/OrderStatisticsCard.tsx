'use client';

import { PackStatisticsDto, ComponentStatisticsDto, VariantStatisticsDto } from '@contracts/core';
import { StatisticsBadge } from './StatisticsBadge';
import { OrderHistoryList } from './OrderHistoryList';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OrderStatisticsCardProps {
  statistics: PackStatisticsDto | ComponentStatisticsDto | VariantStatisticsDto;
  type: 'pack' | 'component' | 'variant';
}

export function OrderStatisticsCard({ statistics, type }: OrderStatisticsCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isPack = type === 'pack';
  const isComponent = type === 'component';
  const isVariant = type === 'variant';

  const packStats = isPack ? (statistics as PackStatisticsDto) : null;
  const componentStats = isComponent ? (statistics as ComponentStatisticsDto) : null;
  const variantStats = isVariant ? (statistics as VariantStatisticsDto) : null;

  return (
    <div className="bg-surface border border-surface-dark rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Order Statistics</h3>
        {((isPack && packStats?.recentOrders && packStats.recentOrders.length > 0) ||
          (isVariant && variantStats?.recentOrders && variantStats.recentOrders.length > 0)) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
          >
            {expanded ? (
              <>
                Hide History <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show History <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {isPack && packStats && (
          <>
            <StatisticsBadge label="Total Orders" value={packStats.totalOrders} variant="primary" />
            <StatisticsBadge
              label="Total Revenue"
              value={`${packStats.totalRevenue.toFixed(2)} TND`}
              variant="success"
            />
            <StatisticsBadge label="Components" value={packStats.componentCount} variant="secondary" />
            {packStats.lastOrderDate && (
              <StatisticsBadge label="Last Order" value={packStats.lastOrderDate} variant="secondary" />
            )}
          </>
        )}

        {isComponent && componentStats && (
          <>
            <StatisticsBadge label="Total Usage" value={componentStats.totalUsage} variant="primary" />
            <StatisticsBadge label="Variants" value={componentStats.variantCount} variant="secondary" />
            <StatisticsBadge label="Packs" value={componentStats.packCount} variant="secondary" />
            {componentStats.lastUsedDate && (
              <StatisticsBadge label="Last Used" value={componentStats.lastUsedDate} variant="secondary" />
            )}
          </>
        )}

        {isVariant && variantStats && (
          <>
            <StatisticsBadge label="Total Orders" value={variantStats.totalOrders} variant="primary" />
            <StatisticsBadge
              label="Current Stock"
              value={variantStats.currentStock}
              variant={variantStats.currentStock > 10 ? 'success' : variantStats.currentStock > 0 ? 'warning' : 'danger'}
            />
            {variantStats.lastOrderDate && (
              <StatisticsBadge label="Last Order" value={variantStats.lastOrderDate} variant="secondary" />
            )}
          </>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-dark">
          {isPack && packStats && packStats.recentOrders.length > 0 && (
            <OrderHistoryList orders={packStats.recentOrders} />
          )}
          {isVariant && variantStats && variantStats.recentOrders.length > 0 && (
            <OrderHistoryList orders={variantStats.recentOrders} />
          )}
          {isComponent && componentStats && componentStats.recentUsage.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Usage (Last 30 Days)</h4>
              <div className="space-y-2">
                {componentStats.recentUsage.map((usage, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-surface-light rounded text-sm"
                  >
                    <span className="text-gray-700">{usage.date}</span>
                    <span className="font-semibold text-primary-600">{usage.count} orders</span>
                    {usage.packNames.length > 0 && (
                      <span className="text-xs text-gray-500">
                        ({usage.packNames.slice(0, 2).join(', ')}
                        {usage.packNames.length > 2 && ` +${usage.packNames.length - 2}`})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
