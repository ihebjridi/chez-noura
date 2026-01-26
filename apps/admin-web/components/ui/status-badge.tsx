'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { DailyMenuStatus, InvoiceStatus, OrderStatus, EntityStatus } from '@contracts/core';

export interface StatusBadgeProps {
  status: DailyMenuStatus | InvoiceStatus | OrderStatus | EntityStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    // DailyMenuStatus
    if (status === DailyMenuStatus.DRAFT) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (status === DailyMenuStatus.PUBLISHED) {
      return 'bg-primary-50 text-primary-700 border-primary-200';
    }
    if (status === DailyMenuStatus.LOCKED) {
      return 'bg-warning-50 text-warning-700 border-warning-200';
    }

    // InvoiceStatus
    if (status === InvoiceStatus.PAID || status === InvoiceStatus.ISSUED) {
      return 'bg-success-50 text-success-700 border-success-200';
    }
    if (status === InvoiceStatus.DRAFT) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    // OrderStatus
    if (status === OrderStatus.CREATED) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (status === OrderStatus.LOCKED) {
      return 'bg-warning-50 text-warning-700 border-warning-200';
    }
    if (status === OrderStatus.CANCELLED) {
      return 'bg-error-50 text-error-700 border-error-200';
    }

    // EntityStatus
    if (status === EntityStatus.ACTIVE) {
      return 'bg-success-50 text-success-700 border-success-200';
    }
    if (status === EntityStatus.INACTIVE) {
      return 'bg-surface-light text-secondary-700 border-secondary-300';
    }

    // Default
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        getStatusStyles(status),
        className
      )}
    >
      {status}
    </span>
  );
}
