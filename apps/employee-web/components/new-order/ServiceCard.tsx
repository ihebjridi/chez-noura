'use client';

import { useTranslation } from 'react-i18next';
import { CutoffCountdown } from '../cutoff-countdown';
import { PackCard } from './PackCard';
import type { AvailablePackDto } from '@contracts/core';

export interface ServiceGroup {
  serviceId: string | null;
  serviceName: string;
  cutoffTime: string | undefined;
  packs: AvailablePackDto[];
}

interface ServiceCardProps {
  group: ServiceGroup;
  onSelectPack: (pack: AvailablePackDto) => void;
}

/** One card per service: service name, countdown for that service, and pack(s). */
export function ServiceCard({ group, onSelectPack }: ServiceCardProps) {
  const { t } = useTranslation();
  const title = group.serviceName || t('newOrder.orderForDate', { defaultValue: 'Order' });

  return (
    <div className="rounded-2xl border-2 border-surface-dark bg-surface overflow-hidden shadow-sm">
      <div className="p-4 border-b border-surface-dark">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {group.cutoffTime && (
        <div className="px-4 pt-2">
          <CutoffCountdown cutoffTime={group.cutoffTime} embedded />
        </div>
      )}
      <div className="p-4 space-y-3">
        {group.packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} onSelect={onSelectPack} />
        ))}
      </div>
    </div>
  );
}
