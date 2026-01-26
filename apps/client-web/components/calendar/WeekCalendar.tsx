'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { OrderDto, EmployeeMenuDto } from '@contracts/core';
import { DayStatus } from '../../hooks/useCalendarStatus';
import { DayStatusCard } from './DayStatusCard';
import { getTodayISO, formatDateToISO } from '../../lib/date-utils';

interface WeekCalendarProps {
  orders: OrderDto[];
  menuAvailability: Record<string, boolean>;
  menus: Record<string, EmployeeMenuDto>;
  onDayClick?: (date: string, status: DayStatus) => void;
  onCustomizeMeal?: (date: string) => void;
}

type ViewMode = 'week' | 'month';

export function WeekCalendar({
  orders,
  menuAvailability,
  menus,
  onDayClick,
  onCustomizeMeal,
}: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const today = getTodayISO();

  // Get week dates
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(formatDateToISO(date));
    }
    return dates;
  }, [currentDate]);

  // Get month dates
  const monthDates = useMemo(() => {
    const dates: Array<{ date: number; fullDate: string }> = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push({ date: 0, fullDate: '' });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      dates.push({
        date: day,
        fullDate: formatDateToISO(date),
      });
    }

    return dates;
  }, [currentDate]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
    setExpandedDate(null);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setExpandedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setExpandedDate(null);
  };

  // Helper function to compute day status (not using hooks)
  const computeDayStatus = (dateStr: string): DayStatus => {
    if (!dateStr) return 'no-menu';
    
    const order = orders.find((o) => o.orderDate === dateStr);
    if (order) return 'ordered';
    
    const hasMenu = menuAvailability[dateStr] || false;
    if (!hasMenu) return 'no-menu';
    
    const menu = menus[dateStr];
    if (!menu) return 'no-menu';
    
    // Check if past cutoff
    const now = new Date();
    const cutoffTime = menu.cutoffTime ? new Date(menu.cutoffTime) : null;
    const isPastCutoff = cutoffTime ? now > cutoffTime : false;
    
    if (isPastCutoff) return 'closed';
    return 'open';
  };

  const handleDayClick = (dateStr: string) => {
    if (!dateStr) return;

    // Prevent interaction with past dates - orders can only be placed for today
    if (dateStr < today) {
      return;
    }

    const status = computeDayStatus(dateStr);
    
    if (expandedDate === dateStr) {
      setExpandedDate(null);
      setSelectedDate(null);
    } else {
      setExpandedDate(dateStr);
      setSelectedDate(dateStr);
      onDayClick?.(dateStr, status);
    }
  };

  const getDayStatus = (dateStr: string): DayStatus => {
    return computeDayStatus(dateStr);
  };

  const getDayClassName = (dateStr: string, isToday: boolean): string => {
    if (!dateStr) return 'bg-transparent';
    
    // Past dates should be disabled and visually distinct
    const isPast = dateStr < today;
    if (isPast) {
      return 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-60';
    }
    
    const status = getDayStatus(dateStr);
    const isSelected = selectedDate === dateStr;
    const isExpanded = expandedDate === dateStr;

    if (isSelected || isExpanded) {
      return 'bg-primary-600 text-white border-2 border-primary-700';
    }

    if (isToday) {
      return 'bg-primary-50 text-primary-700 border-2 border-primary-300';
    }

    switch (status) {
      case 'ordered':
        return 'bg-success-50 text-success-700 border-2 border-success-300 hover:bg-success-100';
      case 'open':
        return 'bg-warning-50 text-warning-700 border-2 border-warning-300 hover:bg-warning-100';
      case 'closed':
      case 'no-menu':
        return 'bg-gray-100 text-gray-500 border-2 border-gray-300';
      default:
        return 'bg-background text-gray-600 border-2 border-surface-dark hover:bg-surface-light';
    }
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-surface border border-surface-dark rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevious}
          className="p-1 hover:bg-surface-light rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            {viewMode === 'week' ? formatWeekRange() : monthYear}
          </h3>
          <button
            onClick={handleToday}
            className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors font-medium min-h-[32px]"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            className="p-2 hover:bg-surface-light rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle view"
          >
            <CalendarIcon className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleNext}
            className="p-1 hover:bg-surface-light rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Week View */}
      {viewMode === 'week' && (
        <>
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
            {weekDates.map((dateStr, index) => {
              const isToday = dateStr === today;
              const status = getDayStatus(dateStr);
              const date = new Date(dateStr);
              const dayNumber = date.getDate();

              return (
                <div key={dateStr} className="min-h-[80px]">
                  <button
                    onClick={() => handleDayClick(dateStr)}
                    className={`w-full h-full rounded transition-colors text-sm font-medium p-2 flex flex-col items-center justify-center ${getDayClassName(dateStr, isToday)}`}
                  >
                    <span>{dayNumber}</span>
                    {status === 'ordered' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-1" />
                    )}
                    {status === 'open' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-1" />
                    )}
                  </button>
                  
                  {expandedDate === dateStr && (
                    <div className="mt-2">
                      {status === 'ordered' && (() => {
                        const order = orders.find((o) => o.orderDate === dateStr);
                        return order ? (
                          <DayStatusCard
                            order={order}
                            onCustomize={
                              order.status === 'CREATED' && onCustomizeMeal
                                ? () => onCustomizeMeal(dateStr)
                                : undefined
                            }
                          />
                        ) : null;
                      })()}
                      
                      {status === 'open' && (
                        <div className="mt-2 p-3 bg-warning-50 border border-warning-300 rounded-lg">
                          <p className="text-sm font-semibold text-warning-800 mb-2">
                            Order available
                          </p>
                          {dateStr >= today ? (
                            <button
                              onClick={() => onCustomizeMeal?.(dateStr)}
                              className="w-full px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-semibold text-sm min-h-[44px]"
                            >
                              Customize Meal
                            </button>
                          ) : (
                            <p className="text-xs text-gray-600">
                              Past dates are read-only
                            </p>
                          )}
                        </div>
                      )}
                      
                      {status === 'closed' && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Ordering closed for this date
                          </p>
                        </div>
                      )}
                      
                      {status === 'no-menu' && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                          <p className="text-sm text-gray-600">
                            No menu available
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <>
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
            {monthDates.map((day, index) => {
              if (day.date === 0) {
                return <div key={index} className="aspect-square" />;
              }

              const isToday = day.fullDate === today;
              const status = getDayStatus(day.fullDate);

              return (
                <div key={index} className="aspect-square">
                  <button
                    onClick={() => handleDayClick(day.fullDate)}
                    className={`w-full h-full rounded transition-colors text-sm font-medium flex flex-col items-center justify-center ${getDayClassName(day.fullDate, isToday)}`}
                  >
                    <span>{day.date}</span>
                    {status === 'ordered' && (
                      <span className="w-1 h-1 rounded-full bg-current mt-0.5" />
                    )}
                    {status === 'open' && (
                      <span className="w-1 h-1 rounded-full bg-current mt-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
