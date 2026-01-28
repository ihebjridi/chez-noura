'use client';

import { DailyMenuWithDetailsDto, DailyMenuStatus, ServiceDto, ServiceWithPacksDto, VariantDto } from '@contracts/core';
import { ServiceSelection } from './ServiceSelection';
import { LockedStateSummary } from '../../app/daily-menus/[id]/components/LockedStateSummary';

interface DailyMenuViewProps {
  dailyMenu: DailyMenuWithDetailsDto | null;
  allServices: ServiceDto[];
  serviceDetails: Map<string, ServiceWithPacksDto>;
  foodComponentVariants: Map<string, VariantDto[]>;
  variantStocks: Map<string, number>;
  updatingVariants: Set<string>;
  expandedServices: Set<string>;
  expandedSections: Set<string>;
  isReadOnly?: boolean;
  onServiceToggle: (serviceId: string, checked: boolean) => void;
  onToggleServiceVariants: (serviceId: string) => void;
  onVariantToggle: (serviceId: string, variantId: string, checked: boolean, componentId: string) => void;
  onStockChange: (serviceId: string, variantId: string, stock: number, isExisting: boolean) => void;
  onToggleSection: (section: string) => void;
}

export function DailyMenuView({
  dailyMenu,
  allServices,
  serviceDetails,
  foodComponentVariants,
  variantStocks,
  updatingVariants,
  expandedServices,
  expandedSections,
  isReadOnly = false,
  onServiceToggle,
  onToggleServiceVariants,
  onVariantToggle,
  onStockChange,
  onToggleSection,
}: DailyMenuViewProps) {
  if (!dailyMenu) {
    return null;
  }

  const isLocked = dailyMenu.status === DailyMenuStatus.LOCKED;
  const isDisabled = isLocked || isReadOnly;
  const selectedServiceIds = new Set(dailyMenu.services.map((s) => s.serviceId));
  
  // Collect all variant IDs from both pack-level and service-level variants
  const selectedVariants = new Set<string>();
  dailyMenu.variants.forEach((v) => selectedVariants.add(v.variantId));
  dailyMenu.services.forEach((s) => s.variants.forEach((v) => selectedVariants.add(v.variantId)));
  
  // Collect variant stocks from both sources
  const existingVariantStocks = new Map<string, number>();
  dailyMenu.variants.forEach((v) => existingVariantStocks.set(v.variantId, v.initialStock));
  dailyMenu.services.forEach((s) =>
    s.variants.forEach((v) => {
      const existing = existingVariantStocks.get(v.variantId);
      existingVariantStocks.set(v.variantId, existing ? Math.max(existing, v.initialStock) : v.initialStock);
    }),
  );

  return (
    <div className="flex-1">
      {isReadOnly && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">Read-only mode:</span>
            <span>This is a past menu and cannot be modified.</span>
          </div>
        </div>
      )}
      <ServiceSelection
        services={allServices}
        selectedServiceIds={selectedServiceIds}
        expandedServices={expandedServices}
        serviceDetails={serviceDetails}
        menuServices={dailyMenu.services}
        foodComponentVariants={foodComponentVariants}
        selectedVariants={selectedVariants}
        variantStocks={variantStocks}
        existingVariantStocks={existingVariantStocks}
        updatingVariants={updatingVariants}
        isLocked={isDisabled}
        isExpanded={expandedSections.has('services')}
        onToggleSection={() => onToggleSection('services')}
        onServiceToggle={onServiceToggle}
        onToggleServiceVariants={onToggleServiceVariants}
        onVariantToggle={onVariantToggle}
        onStockChange={onStockChange}
      />

      {isLocked && <LockedStateSummary dailyMenu={dailyMenu} />}
    </div>
  );
}
