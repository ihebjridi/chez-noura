'use client';

import { useMemo } from 'react';
import { OrderDto, EmployeeMenuDto } from '@contracts/core';

export type DayStatus = 'ordered' | 'open' | 'closed' | 'no-menu';

export interface DayStatusInfo {
  status: DayStatus;
  order?: OrderDto;
  menu?: EmployeeMenuDto;
  isPastCutoff: boolean;
}

export function useCalendarStatus(
  date: string,
  orders: OrderDto[],
  menuAvailability: Record<string, boolean>,
  menus: Record<string, EmployeeMenuDto>,
): DayStatusInfo {
  return useMemo(() => {
    const dateStr = date.split('T')[0]; // Ensure YYYY-MM-DD format
    const order = orders.find((o) => o.orderDate === dateStr);
    const hasMenu = menuAvailability[dateStr] || false;
    const menu = menus[dateStr];

    // If has order, status is 'ordered'
    if (order) {
      return {
        status: 'ordered',
        order,
        menu,
        isPastCutoff: false,
      };
    }

    // If no menu available, status is 'no-menu'
    if (!hasMenu || !menu) {
      return {
        status: 'no-menu',
        isPastCutoff: true,
      };
    }

    // Check if before order start time
    const now = new Date();
    const orderStartTime = menu.orderStartTime ? new Date(menu.orderStartTime) : null;
    const isBeforeStart = orderStartTime ? now < orderStartTime : false;

    // Check if past cutoff
    const cutoffTime = menu.cutoffTime ? new Date(menu.cutoffTime) : null;
    const isPastCutoff = cutoffTime ? now > cutoffTime : false;

    // If before order start time, status is 'closed'
    if (isBeforeStart) {
      return {
        status: 'closed',
        menu,
        isPastCutoff: false,
      };
    }

    // If past cutoff, status is 'closed'
    if (isPastCutoff) {
      return {
        status: 'closed',
        menu,
        isPastCutoff: true,
      };
    }

    // Menu is available and within ordering window, status is 'open'
    return {
      status: 'open',
      menu,
      isPastCutoff: false,
    };
  }, [date, orders, menuAvailability, menus]);
}
