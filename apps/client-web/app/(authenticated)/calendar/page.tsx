'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { OrderDto, EmployeeMenuDto } from '@contracts/core';
import { WeekCalendar } from '../../../components/calendar/WeekCalendar';
import { Loading } from '../../../components/ui/loading';
import { Error } from '../../../components/ui/error';
import { getTodayISO, formatDateToISO } from '../../../lib/date-utils';

export default function CalendarPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [menuAvailability, setMenuAvailability] = useState<Record<string, boolean>>({});
  const [menus, setMenus] = useState<Record<string, EmployeeMenuDto>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get date range for current week
  const getWeekDateRange = () => {
    const today = new Date();
    const day = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - day); // Start from Sunday
    
    const dates: string[] = [];
    for (let i = 0; i < 14; i++) { // Load 2 weeks worth
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(formatDateToISO(date));
    }
    return dates;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load orders
      const ordersData = await apiClient.getMyOrders();
      setOrders(ordersData);

      // Load menu availability for current week range
      const dateRange = getWeekDateRange();
      const today = getTodayISO();
      const availability: Record<string, boolean> = {};
      const menusData: Record<string, EmployeeMenuDto> = {};

      // Check menu availability for each date (only check today and future dates)
      await Promise.all(
        dateRange.map(async (date) => {
          // Skip past dates - they're read-only and don't need menu data for ordering
          if (date < today) {
            availability[date] = false;
            return;
          }
          
          try {
            const menu = await apiClient.getEmployeeMenu(date);
            availability[date] = true;
            menusData[date] = menu;
          } catch (err) {
            // Menu not available for this date
            availability[date] = false;
          }
        })
      );

      setMenuAvailability(availability);
      setMenus(menusData);
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomizeMeal = (date: string) => {
    // Validate that the date is today - orders can only be placed for today
    const today = getTodayISO();
    if (date < today) {
      // Don't navigate to past dates
      return;
    }
    router.push(`/new-order?date=${date}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading message="Loading calendar..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Error message={error} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
        <p className="text-sm text-gray-600 mt-1">
          View your orders and available meal dates
        </p>
      </div>

      <WeekCalendar
        orders={orders}
        menuAvailability={menuAvailability}
        menus={menus}
        onCustomizeMeal={handleCustomizeMeal}
      />
    </div>
  );
}
