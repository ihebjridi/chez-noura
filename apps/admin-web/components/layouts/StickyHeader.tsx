'use client';

import { useState } from 'react';
import { StatusBadge } from '../../app/daily-menus/[id]/components/StatusBadge';
import { DailyMenuStatus } from '@contracts/core';

interface StickyHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  status?: DailyMenuStatus;
  context?: string;
  children?: React.ReactNode;
}

export function StickyHeader({
  selectedDate,
  onDateChange,
  status,
  context,
  children,
}: StickyHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

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
            <button
              onClick={() => onDateChange(today)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedDate === today
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                  : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onDateChange(tomorrow)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedDate === tomorrow
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                  : 'bg-surface-light text-gray-700 hover:bg-surface-dark border-2 border-transparent'
              }`}
            >
              Tomorrow
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-light text-gray-700 hover:bg-surface-dark transition-colors border-2 border-transparent whitespace-nowrap"
              >
                Other Date
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 right-0 bg-surface border border-surface-dark rounded-lg shadow-lg p-3 z-50">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      onDateChange(e.target.value);
                      setShowDatePicker(false);
                    }}
                    min={today}
                    className="px-3 py-2 border border-surface-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-background"
                  />
                </div>
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
