'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyMenuDto, DailyMenuStatus } from '@contracts/core';
import { getTodayISO, getTomorrowISO } from '../../lib/date-utils';

interface MenuCalendarProps {
  menus: DailyMenuDto[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export function MenuCalendar({ menus, selectedDate, onDateSelect }: MenuCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = getTodayISO();
  const tomorrow = getTomorrowISO();

  // Create a map of dates to menus for quick lookup
  const menuMap = useMemo(() => {
    const map = new Map<string, DailyMenuDto>();
    menus.forEach((menu) => {
      map.set(menu.date, menu);
    });
    return map;
  }, [menus]);

  // Helper function to format date to YYYY-MM-DD using local timezone
  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week that contains the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last day of the week that contains the last day of month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: Array<{ date: Date; isCurrentMonth: boolean; dateString: string }> = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        dateString: formatDateToISO(current),
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  const getStatusColor = (status: DailyMenuStatus) => {
    switch (status) {
      case DailyMenuStatus.DRAFT:
        return 'bg-blue-100 border-blue-300';
      case DailyMenuStatus.PUBLISHED:
        return 'bg-primary-100 border-primary-300';
      case DailyMenuStatus.LOCKED:
        return 'bg-warning-100 border-warning-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusDot = (status: DailyMenuStatus) => {
    switch (status) {
      case DailyMenuStatus.DRAFT:
        return 'bg-blue-500';
      case DailyMenuStatus.PUBLISHED:
        return 'bg-primary-500';
      case DailyMenuStatus.LOCKED:
        return 'bg-warning-500';
      default:
        return 'bg-gray-400';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const todayDate = new Date();
    setCurrentMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    onDateSelect(getTodayISO());
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-surface border border-surface-dark rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-surface-dark rounded-lg transition-colors"
        >
          Today
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 hover:bg-surface-dark rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {monthName}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 hover:bg-surface-dark rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-600 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const menu = menuMap.get(day.dateString);
          const isToday = day.dateString === today;
          const isTomorrow = day.dateString === tomorrow;
          const isSelected = day.dateString === selectedDate;
          const isPast = day.dateString < today;

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day.dateString)}
              className={`
                relative p-2 min-h-[60px] rounded-lg border-2 transition-all
                ${!day.isCurrentMonth ? 'opacity-40' : ''}
                ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:border-gray-300'}
                ${menu ? getStatusColor(menu.status) : 'bg-surface-light hover:bg-surface-dark'}
                ${isToday ? 'ring-2 ring-primary-300' : ''}
              `}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1 w-full">
                  <span
                    className={`
                      text-sm font-medium
                      ${isToday ? 'text-primary-700 font-bold' : ''}
                      ${isTomorrow ? 'text-blue-700' : ''}
                      ${isPast ? 'text-gray-500' : 'text-gray-900'}
                    `}
                  >
                    {day.date.getDate()}
                  </span>
                  {menu && (
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusDot(menu.status)}`}
                      title={menu.status}
                    />
                  )}
                </div>
                {menu && (
                  <span className="text-xs text-gray-600 truncate w-full">
                    {menu.status}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-surface-dark flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-gray-600">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-gray-600">Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning-500" />
          <span className="text-gray-600">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">No Menu</span>
        </div>
      </div>
    </div>
  );
}
