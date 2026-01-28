'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { StatusBadge } from '../../app/daily-menus/[id]/components/StatusBadge';
import { DailyMenuStatus, DailyMenuDto } from '@contracts/core';
import { MenuCalendar } from '../menus/MenuCalendar';
import { getTodayISO, getTomorrowISO } from '../../lib/date-utils';

interface StickyHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  status?: DailyMenuStatus;
  context?: string;
  menus?: DailyMenuDto[];
  children?: React.ReactNode;
}

export function StickyHeader({
  selectedDate,
  onDateChange,
  status,
  context,
  menus = [],
  children,
}: StickyHeaderProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const today = getTodayISO();
  const tomorrow = getTomorrowISO();
  
  const handleDateSelect = (date: string) => {
    onDateChange(date);
    setShowCalendar(false);
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const todayDate = new Date(today);
    const tomorrowDate = new Date(tomorrow);

    if (dateString === today) {
      return 'Today';
    } else if (dateString === tomorrow) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-surface-dark shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  showCalendar
                    ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                    : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </button>
              {showCalendar && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCalendar(false)}
                  />
                  {/* Calendar Popover */}
                  <div className="absolute top-full mt-2 left-0 bg-surface border border-surface-dark rounded-lg shadow-xl z-50 min-w-[350px]">
                    <MenuCalendar
                      menus={menus}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Date Display & Status */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatFullDate(selectedDate)}
              </div>
              {context && (
                <div className="text-xs text-gray-600 mt-0.5">{context}</div>
              )}
            </div>
            {status && <StatusBadge status={status} />}
          </div>
        </div>

        {/* Additional Content */}
        {children && (
          <div className="pb-4 border-t border-surface-dark pt-4 mt-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
