'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { OrderDto } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { PageHeader } from '../../components/ui/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { StatusBadge } from '../../components/ui/status-badge';
import { formatDate, formatDateTime } from '../../lib/date-utils';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';

export default function OrdersPage() {
  const { orders, loading, error, loadOrders, setError } = useOrders();
  const [expandedBusinesses, setExpandedBusinesses] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Group orders by business
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, OrderDto[]>();
    orders.forEach((order) => {
      const key = order.businessName;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(order);
    });

    // Sort orders within each group by orderDate desc
    groups.forEach((businessOrders) => {
      businessOrders.sort(
        (a, b) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
      );
    });

    // Sort business groups alphabetically
    return Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [orders]);

  const toggleBusiness = (businessName: string) => {
    setExpandedBusinesses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(businessName)) {
        newSet.delete(businessName);
      } else {
        newSet.add(businessName);
      }
      return newSet;
    });
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

  // Calculate totals for each business
  const getBusinessTotal = (businessOrders: OrderDto[]): number => {
    return businessOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Orders"
        description="View and manage all orders grouped by business"
      />

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
        <div className="space-y-4">
          {groupedOrders.map(([businessName, businessOrders]) => {
            const isBusinessExpanded = expandedBusinesses.has(businessName);
            const businessTotal = getBusinessTotal(businessOrders);

            return (
              <div
                key={businessName}
                className="bg-surface border border-surface-dark rounded-lg overflow-hidden"
              >
                {/* Business Group Header */}
                <div
                  className="bg-surface-dark px-6 py-4 cursor-pointer hover:bg-surface-light transition-colors"
                  onClick={() => toggleBusiness(businessName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isBusinessExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {businessName}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600 font-normal">
                            {businessOrders.length} order
                            {businessOrders.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            Total: {businessTotal.toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders Table */}
                {isBusinessExpanded && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Pack</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-center">Items</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businessOrders.map((order) => {
                          const isOrderExpanded = expandedOrders.has(order.id);
                          return (
                            <React.Fragment key={order.id}>
                              <TableRow
                                className="cursor-pointer"
                                onClick={() => toggleOrder(order.id)}
                              >
                                <TableCell className="whitespace-nowrap">
                                  {isOrderExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm text-gray-900 font-medium">
                                  {formatDate(order.orderDate)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {order.employeeName}
                                  </div>
                                  <div className="text-sm text-gray-600 font-normal">
                                    {order.employeeEmail}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {order.packName}
                                  </div>
                                  <div className="text-sm text-gray-600 font-normal">
                                    {order.packPrice.toFixed(2)} TND
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <StatusBadge status={order.status} />
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                  {order.totalAmount.toFixed(2)} TND
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm text-gray-600 text-center font-normal">
                                  {order.items.length}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm text-gray-600 font-normal">
                                  {formatDateTime(order.createdAt)}
                                </TableCell>
                              </TableRow>
                              {isOrderExpanded && (
                                <TableRow>
                                  <TableCell
                                    colSpan={8}
                                    className="px-6 py-4 bg-surface-light"
                                  >
                                    <div className="space-y-4">
                                      {/* Order ID */}
                                      <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Order ID
                                        </span>
                                        <p className="mt-1 text-sm text-gray-900 font-mono">
                                          {order.id}
                                        </p>
                                      </div>

                                      {/* Pack Details */}
                                      <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Pack Details
                                        </span>
                                        <div className="mt-1 text-sm text-gray-900">
                                          <p className="font-medium">
                                            {order.packName}
                                          </p>
                                          <p className="text-gray-600">
                                            Price: {order.packPrice.toFixed(2)}{' '}
                                            TND
                                          </p>
                                        </div>
                                      </div>

                                      {/* Order Items */}
                                      <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Order Items
                                        </span>
                                        <div className="mt-2 space-y-2">
                                          {order.items.map((item) => (
                                            <div
                                              key={item.id}
                                              className="flex items-center justify-between py-2 px-3 bg-surface rounded border border-surface-dark"
                                            >
                                              <div>
                                                <span className="text-sm font-medium text-gray-900">
                                                  {item.componentName}
                                                </span>
                                                <span className="text-sm text-gray-600 mx-2">
                                                  →
                                                </span>
                                                <span className="text-sm text-gray-700">
                                                  {item.variantName}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Order Metadata */}
                                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-dark">
                                        <div>
                                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order Date
                                          </span>
                                          <p className="mt-1 text-sm text-gray-900">
                                            {formatDate(order.orderDate)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                          </span>
                                          <p className="mt-1 text-sm text-gray-900">
                                            {formatDateTime(order.createdAt)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Updated
                                          </span>
                                          <p className="mt-1 text-sm text-gray-900">
                                            {formatDateTime(order.updatedAt)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount
                                          </span>
                                          <p className="mt-1 text-sm font-medium text-gray-900">
                                            {order.totalAmount.toFixed(2)} TND
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
