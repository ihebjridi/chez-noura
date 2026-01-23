'use client';

import { DailyMenuWithDetailsDto, DailyMenuStatus, PackDto, PackWithComponentsDto, VariantDto } from '@contracts/core';
import { PackSelection } from '../daily-menus/[id]/components/PackSelection';
import { LockedStateSummary } from '../daily-menus/[id]/components/LockedStateSummary';

interface DailyMenuViewProps {
  dailyMenu: DailyMenuWithDetailsDto | null;
  allPacks: PackDto[];
  packDetails: Map<string, PackWithComponentsDto>;
  foodComponentVariants: Map<string, VariantDto[]>;
  variantStocks: Map<string, number>;
  updatingVariants: Set<string>;
  expandedPacks: Set<string>;
  expandedSections: Set<string>;
  onPackToggle: (packId: string, checked: boolean) => void;
  onTogglePackVariants: (packId: string) => void;
  onVariantToggle: (variantId: string, checked: boolean, foodComponentId: string) => void;
  onStockChange: (variantId: string, stock: number, isExisting: boolean) => void;
  onToggleSection: (section: string) => void;
}

export function DailyMenuView({
  dailyMenu,
  allPacks,
  packDetails,
  foodComponentVariants,
  variantStocks,
  updatingVariants,
  expandedPacks,
  expandedSections,
  onPackToggle,
  onTogglePackVariants,
  onVariantToggle,
  onStockChange,
  onToggleSection,
}: DailyMenuViewProps) {
  if (!dailyMenu) {
    return null;
  }

  const isLocked = dailyMenu.status === DailyMenuStatus.LOCKED;
  const selectedPackIds = new Set(dailyMenu.packs.map((p) => p.packId));
  const selectedVariants = new Set(dailyMenu.variants.map((v) => v.variantId));
  const existingVariantStocks = new Map(
    dailyMenu.variants.map((v) => [v.variantId, v.initialStock])
  );

  return (
    <div className="flex-1">
      <PackSelection
        packs={allPacks}
        selectedPackIds={selectedPackIds}
        expandedPacks={expandedPacks}
        packDetails={packDetails}
        foodComponentVariants={foodComponentVariants}
        selectedVariants={selectedVariants}
        variantStocks={variantStocks}
        existingVariantStocks={existingVariantStocks}
        updatingVariants={updatingVariants}
        isLocked={isLocked}
        isExpanded={expandedSections.has('packs')}
        onToggleSection={() => onToggleSection('packs')}
        onPackToggle={onPackToggle}
        onTogglePackVariants={onTogglePackVariants}
        onVariantToggle={onVariantToggle}
        onStockChange={onStockChange}
      />

      {isLocked && <LockedStateSummary dailyMenu={dailyMenu} />}
    </div>
  );
}
