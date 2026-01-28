'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CutoffCountdownProps {
  cutoffTime: string; // ISO datetime string
}

function TimeCard({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) {
  const displayValue = String(value).padStart(2, '0');
  
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl 
          flex items-center justify-center
          font-bold text-2xl sm:text-3xl
          transition-all duration-300
          ${
            isUrgent
              ? 'bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-lg shadow-warning-500/30 animate-pulse'
              : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
          }
        `}
      >
        <span className="relative z-10">{displayValue}</span>
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      </div>
      <span
        className={`
          mt-2 text-xs sm:text-sm font-medium uppercase tracking-wider
          ${isUrgent ? 'text-warning-700' : 'text-gray-600'}
        `}
      >
        {label}
      </span>
    </div>
  );
}

export function CutoffCountdown({ cutoffTime }: CutoffCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  // Early return if no cutoffTime provided
  if (!cutoffTime) {
    return null;
  }

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        const now = new Date();
        const cutoff = new Date(cutoffTime);
        
        // Check if date is valid
        if (isNaN(cutoff.getTime())) {
          console.error('Invalid cutoff time:', cutoffTime);
          return null;
        }
        
        const diff = cutoff.getTime() - now.getTime();

        if (diff <= 0) {
          return {
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true,
          };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
          hours,
          minutes,
          seconds,
          isExpired: false,
        };
      } catch (error) {
        console.error('Error calculating time remaining:', error);
        return null;
      }
    };

    // Calculate immediately
    const initial = calculateTimeRemaining();
    setTimeRemaining(initial);

    // Only set interval if we have valid time
    if (initial) {
      // Update every second
      const interval = setInterval(() => {
        const result = calculateTimeRemaining();
        if (result) {
          setTimeRemaining(result);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cutoffTime]);

  if (!timeRemaining) {
    return null;
  }

  if (timeRemaining.isExpired) {
    return (
      <div className="mx-4 mt-4 p-5 bg-gradient-to-br from-warning-50 to-warning-100 border-2 border-warning-300 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-warning-500 rounded-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base md:text-lg font-bold text-warning-900">
              Ordering Closed
            </p>
            <p className="text-sm text-warning-700 mt-0.5">
              The cutoff time has passed
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isUrgent = timeRemaining.hours < 1;
  const isVeryUrgent = timeRemaining.hours === 0 && timeRemaining.minutes < 15;

  return (
    <div
      className={`
        mx-4 mt-4 p-5 sm:p-6 rounded-2xl
        border-2 transition-all duration-300
        ${
          isVeryUrgent
            ? 'bg-gradient-to-br from-warning-50 via-warning-100 to-warning-50 border-warning-400 shadow-xl shadow-warning-500/20'
            : isUrgent
            ? 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-300 shadow-lg'
            : 'bg-gradient-to-br from-primary-50 via-white to-primary-50 border-primary-200 shadow-lg'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`
            p-2 rounded-lg transition-all duration-300
            ${
              isVeryUrgent
                ? 'bg-warning-500 animate-pulse'
                : isUrgent
                ? 'bg-warning-500'
                : 'bg-primary-500'
            }
          `}
        >
          <Clock
            className={`
              w-5 h-5 text-white
              ${isVeryUrgent ? 'animate-spin' : ''}
            `}
            style={{
              animationDuration: isVeryUrgent ? '2s' : undefined,
            }}
          />
        </div>
        <div>
          <h3
            className={`
              text-base sm:text-lg font-bold
              ${isUrgent ? 'text-warning-900' : 'text-gray-900'}
            `}
          >
            Ordering Closes In
          </h3>
          <p
            className={`
              text-xs sm:text-sm mt-0.5
              ${isUrgent ? 'text-warning-700' : 'text-gray-600'}
            `}
          >
            {isVeryUrgent
              ? '⏰ Hurry! Time is running out'
              : isUrgent
              ? 'Less than an hour remaining'
              : 'Place your order before the cutoff'}
          </p>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <TimeCard
          value={timeRemaining.hours}
          label="Hours"
          isUrgent={isUrgent}
        />
        <div
          className={`
            text-2xl sm:text-3xl font-bold
            ${isUrgent ? 'text-warning-600' : 'text-primary-500'}
            animate-pulse
          `}
          style={{ animationDuration: '1s' }}
        >
          :
        </div>
        <TimeCard
          value={timeRemaining.minutes}
          label="Minutes"
          isUrgent={isUrgent}
        />
        <div
          className={`
            text-2xl sm:text-3xl font-bold
            ${isUrgent ? 'text-warning-600' : 'text-primary-500'}
            animate-pulse
          `}
          style={{ animationDuration: '1s' }}
        >
          :
        </div>
        <TimeCard
          value={timeRemaining.seconds}
          label="Seconds"
          isUrgent={isUrgent}
        />
      </div>

      {/* Progress Bar */}
      {isUrgent && (
        <div className="mt-4 pt-4 border-t border-warning-200">
          <div className="flex items-center justify-between text-xs text-warning-700 mb-1">
            <span>Time Remaining</span>
            <span className="font-semibold">
              {timeRemaining.minutes}m {timeRemaining.seconds}s
            </span>
          </div>
          <div className="w-full bg-warning-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-warning-500 to-warning-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${
                  ((timeRemaining.minutes * 60 + timeRemaining.seconds) / 3600) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
