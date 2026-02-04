'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Empty } from '../ui/empty';
import { ServiceCard, type ServiceGroup } from './ServiceCard';
import type { AvailablePackDto } from '@contracts/core';
import type { EmployeeMenuDto } from '@contracts/core';

interface ServicePackListProps {
  menu: EmployeeMenuDto;
  packs: AvailablePackDto[];
  onSelectPack: (pack: AvailablePackDto) => void;
}

/** Groups packs by service and renders one ServiceCard per service (countdown inside each card). */
export function ServicePackList({ menu, packs, onSelectPack }: ServicePackListProps) {
  const { t } = useTranslation();

  const groups = useMemo((): ServiceGroup[] => {
    if (packs.length === 0) return [];

    const byService = new Map<string | null, AvailablePackDto[]>();
    for (const pack of packs) {
      const key = pack.serviceId ?? null;
      if (!byService.has(key)) byService.set(key, []);
      byService.get(key)!.push(pack);
    }

    const serviceWindows = menu.serviceWindows ?? [];
    const cutoffByService = new Map(
      serviceWindows.map((sw) => [sw.serviceId, sw.cutoffTime])
    );

    return Array.from(byService.entries()).map(([serviceId, servicePacks]) => {
      const first = servicePacks[0];
      const serviceName = first?.serviceName || t('newOrder.orderForDate', { defaultValue: 'Order' });
      const cutoffTime = serviceId != null ? cutoffByService.get(serviceId) : menu.cutoffTime;
      return {
        serviceId,
        serviceName,
        cutoffTime,
        packs: servicePacks,
      };
    });
  }, [menu, packs, t]);

  if (groups.length === 0) {
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
    <div className="space-y-6">
      {groups.map((group) => (
        <ServiceCard
          key={group.serviceId ?? 'default'}
          group={group}
          onSelectPack={onSelectPack}
        />
      ))}
    </div>
  );
}
