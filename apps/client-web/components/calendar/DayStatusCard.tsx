'use client';

import { OrderDto, OrderStatus } from '@contracts/core';
import { CheckCircle, Clock, Package } from 'lucide-react';

interface DayStatusCardProps {
  order: OrderDto;
  onCustomize?: () => void;
}

export function DayStatusCard({ order, onCustomize }: DayStatusCardProps) {
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.LOCKED:
        return {
          icon: CheckCircle,
          message: 'Confirmed - Ready for pickup',
          className: 'bg-success-50 border-success-300 text-success-700',
        };
      case OrderStatus.CREATED:
        return {
          icon: Clock,
          message: 'Pending confirmation',
          className: 'bg-warning-50 border-warning-300 text-warning-800',
        };
      default:
        return {
          icon: Clock,
          message: status,
          className: 'bg-secondary-100 border-secondary-300 text-secondary-700',
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`mt-3 p-4 rounded-lg border ${statusInfo.className}`}>
      <div className="flex items-start gap-3">
        <StatusIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm">Your Order</p>
            <span className="px-2 py-1 rounded text-xs font-medium bg-white/50">
              {order.status}
            </span>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <p className="text-sm font-medium">{order.packName}</p>
            </div>
            <p className="text-xs text-gray-600">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.totalAmount.toFixed(2)} TND
            </p>
          </div>

          <p className="text-sm mb-3">{statusInfo.message}</p>
          
          {onCustomize && order.status === OrderStatus.CREATED && (
            <button
              onClick={onCustomize}
              className="px-3 py-1.5 text-sm bg-white/50 hover:bg-white/70 rounded border font-medium transition-colors"
            >
              Customize
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
