'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { getTodayISO, getTomorrowISO } from '../../lib/date-utils';

interface DateHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onMenuClick?: () => void;
}

export function DateHeader({ selectedDate, onDateChange, onMenuClick }: DateHeaderProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = getTodayISO();
  const tomorrow = getTomorrowISO();

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
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 flex-1 justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDateChange(today)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDate === today
                  ? 'bg-primary-100 text-primary-900 border-2 border-primary-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => onDateChange(tomorrow)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDate === tomorrow
                  ? 'bg-primary-100 text-primary-900 border-2 border-primary-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              Tomorrow
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border-2 border-transparent"
              >
                Other Date
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      onDateChange(e.target.value);
                      setShowDatePicker(false);
                    }}
                    min={today}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-900 px-4">
            {formatFullDate(selectedDate)}
          </div>
        </div>
      </div>
    </header>
  );
}
