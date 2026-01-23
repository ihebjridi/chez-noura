'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CutoffCountdownProps {
  cutoffTime: string; // ISO datetime string
}

export function CutoffCountdown({ cutoffTime }: CutoffCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const cutoff = new Date(cutoffTime);
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
    };

    // Calculate immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [cutoffTime]);

  if (!timeRemaining) {
    return null;
  }

  if (timeRemaining.isExpired) {
    return (
      <div className="mx-4 mt-4 p-4 bg-warning-50 border border-warning-300 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning-800" />
          <p className="text-sm md:text-base font-semibold text-warning-800">
            Ordering closed
          </p>
        </div>
      </div>
    );
  }

  const isUrgent = timeRemaining.hours < 1;
  const timeText = `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;

  return (
    <div
      className={`mx-4 mt-4 p-4 rounded-lg border ${
        isUrgent
          ? 'bg-warning-50 border-warning-300'
          : 'bg-surface border-surface-dark'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Clock
          className={`w-5 h-5 ${
            isUrgent ? 'text-warning-800' : 'text-primary-600'
          }`}
        />
        <p
          className={`text-sm md:text-base font-semibold ${
            isUrgent ? 'text-warning-800' : 'text-gray-900'
          }`}
        >
          Ordering closes in:
        </p>
      </div>
      <p
        className={`text-lg md:text-xl font-semibold ${
          isUrgent ? 'text-warning-800' : 'text-primary-600'
        }`}
      >
        {timeText}
      </p>
    </div>
  );
}
