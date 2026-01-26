'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OrderDto } from '@contracts/core';
import { getTodayISO, formatDateToISO } from '../lib/date-utils';

interface OrderCalendarProps {
  orders: OrderDto[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

export function OrderCalendar({
  orders,
  selectedDate,
  onDateSelect,
}: OrderCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get unique dates that have orders
  const orderDates = useMemo(() => {
    return new Set(orders.map((order) => order.orderDate));
  }, [orders]);

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Array<{ date: number; fullDate: string; hasOrder: boolean }> = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: 0, fullDate: '', hasOrder: false });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const dateStr = formatDateToISO(date);
      days.push({
        date: day,
        fullDate: dateStr,
        hasOrder: orderDates.has(dateStr),
      });
    }

    return days;
  }, [currentMonth, orderDates, startingDayOfWeek, daysInMonth]);

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const today = getTodayISO();

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    const todayDate = new Date();
    setCurrentMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    onDateSelect(today);
  };

  const handleDateClick = (fullDate: string) => {
    if (!fullDate) return;
    onDateSelect(selectedDate === fullDate ? null : fullDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-surface border border-surface-dark rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-1 hover:bg-surface-light rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            {monthYear}
          </h3>
          <button
            onClick={handleToday}
            className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors font-medium"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-surface-light rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day.date === 0) {
            return <div key={index} className="aspect-square" />;
          }

          const isSelected = selectedDate === day.fullDate;
          const isToday = day.fullDate === today;
          const hasOrder = day.hasOrder;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day.fullDate)}
              className={`aspect-square rounded transition-colors text-sm font-medium ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : isToday
                    ? 'bg-primary-50 text-primary-700 border-2 border-primary-300'
                    : hasOrder
                      ? 'bg-surface-light text-gray-900 hover:bg-surface-dark'
                      : 'bg-background text-gray-600 hover:bg-surface-light'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{day.date}</span>
                {hasOrder && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-primary-600 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-surface-dark">
          <button
            onClick={() => onDateSelect(null)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Show all orders
          </button>
        </div>
      )}
    </div>
  );
}
