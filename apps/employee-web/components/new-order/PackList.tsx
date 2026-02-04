'use client';

import { useTranslation } from 'react-i18next';
import { Empty } from '../ui/empty';
import { PackCard } from './PackCard';
import type { AvailablePackDto } from '@contracts/core';

interface PackListProps {
  packs: AvailablePackDto[];
  onSelectPack: (pack: AvailablePackDto) => void;
}

/** List of available packs. Used by new-order page when no pack is selected. */
export function PackList({ packs, onSelectPack }: PackListProps) {
  const { t } = useTranslation();

  if (packs.length === 0) {
    return (
      <div className="bg-surface border border-surface-dark rounded-lg p-6">
        <Empty
          message={t('menu.noMenu')}
          description={t('common.messages.menuNotAvailableDate')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {packs.map((pack) => (
        <PackCard key={pack.id} pack={pack} onSelect={onSelectPack} />
      ))}
    </div>
  );
}
