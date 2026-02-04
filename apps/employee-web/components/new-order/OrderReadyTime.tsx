'use client';

import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

export interface ReadyTimeInfo {
  date: Date;
  isToday: boolean;
  timeStr: string;
}

interface OrderReadyTimeProps {
  readyTime: ReadyTimeInfo;
  locale: string;
}

/** Displays when the order will be ready. Used by PlaceOrderBar. */
export function OrderReadyTime({ readyTime, locale }: OrderReadyTimeProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-2.5 mb-2.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">
            {t('common.labels.readyAt')}
          </p>
          <p className="text-sm font-bold text-black">
            {readyTime.isToday
              ? `${t('common.labels.today')} ${readyTime.timeStr}`
              : readyTime.date.toLocaleDateString(locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
          </p>
        </div>
      </div>
    </div>
  );
}
