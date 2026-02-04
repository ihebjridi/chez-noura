'use client';

import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import type { OrderDto } from '@contracts/core';

interface ExistingOrdersNoticeProps {
  existingOrders: OrderDto[];
}

/** Used by new-order page. Shows when the user has already placed orders for the selected date. */
export function ExistingOrdersNotice({ existingOrders }: ExistingOrdersNoticeProps) {
  const { t } = useTranslation();

  if (existingOrders.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-warning-50 border border-warning-300 text-warning-800 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-semibold">
          {existingOrders.length === 1
            ? `You have already placed an order for ${existingOrders[0].serviceName || 'today'}.`
            : `You have already placed ${existingOrders.length} orders for today.`}
        </p>
      </div>
    </div>
  );
}
