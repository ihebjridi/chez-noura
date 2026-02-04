'use client';

import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

interface NewOrderDateHeaderProps {
  selectedDate: string;
  formattedDate: string;
}

/** Used by new-order page. Displays the selected order date (today/tomorrow/formatted). */
export function NewOrderDateHeader({ selectedDate, formattedDate }: NewOrderDateHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-black mb-2">{t('newOrder.title')}</h1>
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-600" />
        <p className="text-base font-medium text-gray-700">{formattedDate}</p>
      </div>
    </div>
  );
}
