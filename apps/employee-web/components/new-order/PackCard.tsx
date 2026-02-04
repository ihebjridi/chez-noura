'use client';

import { useTranslation } from 'react-i18next';
import { Package, ChevronRight } from 'lucide-react';
import { Card } from '../ui/card';
import type { AvailablePackDto } from '@contracts/core';

interface PackCardProps {
  pack: AvailablePackDto;
  onSelect: (pack: AvailablePackDto) => void;
}

/** Single pack card in the pack list. Used by PackList. */
export function PackCard({ pack, onSelect }: PackCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden transition-transform duration-200">
      <button
        type="button"
        onClick={() => onSelect(pack)}
        className="relative z-10 w-full p-5 sm:p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-black truncate">{pack.name}</h3>
                {pack.serviceName && (
                  <p className="text-sm text-gray-500 font-medium mt-0.5 truncate">
                    {pack.serviceName}
                  </p>
                )}
              </div>
            </div>
            <p className="text-base text-gray-600 mb-2">
              {pack.components.length}{' '}
              {pack.components.length !== 1 ? t('common.labels.items') : t('common.labels.item')}
            </p>
            <p className="text-sm text-primary-600 font-semibold flex items-center gap-1">
              {t('common.buttons.customize')}
              <ChevronRight className="w-4 h-4" />
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
        </div>
      </button>
    </Card>
  );
}
