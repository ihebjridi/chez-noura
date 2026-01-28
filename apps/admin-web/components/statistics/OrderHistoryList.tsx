'use client';

import { RecentOrderDto } from '@contracts/core';

interface OrderHistoryListProps {
  orders: RecentOrderDto[];
}

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">No recent orders</div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Orders</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="flex items-center justify-between p-2 bg-surface-light rounded text-sm"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{order.orderDate}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    order.status === 'LOCKED'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'CREATED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              {order.businessName && (
                <div className="text-xs text-gray-500 mt-1">
                  {order.businessName}
                  {order.employeeName && ` • ${order.employeeName}`}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{order.totalAmount.toFixed(2)} TND</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
