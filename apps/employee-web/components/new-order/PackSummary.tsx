'use client';

import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import type { AvailablePackDto } from '@contracts/core';

interface PackSummaryProps {
  pack: AvailablePackDto;
  onChangePack: () => void;
  /** When true, the card is sticky with blur/transparency */
  sticky?: boolean;
}

/** Selected pack header with "Ordering for [service]" and Change. */
export function PackSummary({ pack, onChangePack, sticky }: PackSummaryProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`border-2 border-primary-200 rounded-xl p-4 shadow-sm backdrop-blur-md bg-white/85 ${
        sticky ? 'sticky top-0 z-40' : ''
      }`}
    >
      {pack.serviceName && (
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-1">
          {t('newOrder.orderingFor', { defaultValue: 'Ordering for' })} {pack.serviceName}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{pack.name}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangePack}
          className="px-4 py-2 rounded-xl font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-all duration-200 border-2 border-transparent hover:border-primary-200 min-h-[44px] flex-shrink-0"
        >
          {t('common.labels.change')}
        </button>
      </div>
      <p className="text-sm text-gray-600">
        {pack.components.length}{' '}
        {pack.components.length !== 1 ? t('common.labels.items') : t('common.labels.item')}
      </p>
    </div>
  );
}
