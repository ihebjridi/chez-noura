'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { OrderSummaryDto, OrderStatus } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.getAdminOrders();
      // Convert OrderDto[] to OrderSummaryDto[] format
      const summaries: OrderSummaryDto[] = data.map((order) => ({
        orderId: order.id,
        employeeEmail: order.employeeEmail,
        employeeName: order.employeeName,
        orderDate: order.orderDate,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      }));
      setOrders(summaries);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-600 font-normal">View and manage all orders</p>
      </div>

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={loadOrders} />
        </div>
      )}

      {loading ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading orders..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No orders found"
            description="Orders will appear here when employees place them."
          />
        </div>
      ) : (
        <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-dark">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.orderId);
                  return (
                    <>
                      <tr
                        key={order.orderId}
                        className="hover:bg-surface-light cursor-pointer"
                        onClick={() => toggleOrder(order.orderId)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{order.orderId.substring(0, 8)}...</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.employeeName}</div>
                          <div className="text-sm text-gray-600 font-normal">{order.employeeEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-normal">{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === OrderStatus.LOCKED 
                              ? 'bg-warning-50 text-warning-700' 
                              : order.status === OrderStatus.CREATED 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{order.totalAmount.toFixed(2)} TND</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center font-normal">{order.itemCount}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-surface-light">
                            <div className="text-sm text-gray-600 font-normal">
                              Order details would be loaded here. Click to collapse.
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
