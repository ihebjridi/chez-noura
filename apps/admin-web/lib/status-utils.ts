/**
 * Status color utilities
 */

import { DailyMenuStatus, InvoiceStatus, OrderStatus, EntityStatus } from '@contracts/core';

export function getStatusColor(status: string): string {
  // DailyMenuStatus
  if (status === DailyMenuStatus.DRAFT) {
    return 'bg-blue-100 border-blue-300';
  }
  if (status === DailyMenuStatus.PUBLISHED) {
    return 'bg-primary-100 border-primary-300';
  }
  if (status === DailyMenuStatus.LOCKED) {
    return 'bg-warning-100 border-warning-300';
  }

  // InvoiceStatus
  if (status === InvoiceStatus.PAID || status === InvoiceStatus.ISSUED) {
    return 'bg-success-50 text-success-700';
  }
  if (status === InvoiceStatus.DRAFT) {
    return 'bg-blue-50 text-blue-700';
  }

  // OrderStatus
  if (status === OrderStatus.CREATED) {
    return 'bg-blue-50 text-blue-700';
  }
  if (status === OrderStatus.LOCKED) {
    return 'bg-warning-50 text-warning-700';
  }
  if (status === OrderStatus.CANCELLED) {
    return 'bg-error-50 text-error-700';
  }

  // EntityStatus
  if (status === EntityStatus.ACTIVE) {
    return 'bg-success-50 text-success-700';
  }
  if (status === EntityStatus.INACTIVE) {
    return 'bg-surface-light text-secondary-700';
  }

  // Default
  return 'bg-gray-100 text-gray-800';
}

export function getStatusDotColor(status: string): string {
  if (status === DailyMenuStatus.DRAFT) {
    return 'bg-blue-500';
  }
  if (status === DailyMenuStatus.PUBLISHED) {
    return 'bg-primary-500';
  }
  if (status === DailyMenuStatus.LOCKED) {
    return 'bg-warning-500';
  }
  return 'bg-gray-400';
}
