'use client';

import { VariantDto, ServiceWithPacksDto, DailyMenuPackDto } from '@contracts/core';
import { VariantRow } from '../../app/daily-menus/[id]/components/VariantRow';
import { Package } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useState, useEffect } from 'react';
import { PackWithComponentsDto } from '@contracts/core';

interface ServiceVariantsManagerProps {
  serviceId: string;
  serviceName: string;
  servicePacks: DailyMenuPackDto[];
  serviceDetails: ServiceWithPacksDto | undefined;
  foodComponentVariants: Map<string, VariantDto[]>;
  selectedVariants: Set<string>;
  variantStocks: Map<string, number>;
  existingVariantStocks: Map<string, number>;
  updatingVariants: Set<string>;
  isLocked: boolean;
  onVariantToggle: (variantId: string, checked: boolean, componentId: string) => void;
  onStockChange: (variantId: string, stock: number, isExisting: boolean) => void;
}

export function ServiceVariantsManager({
  serviceId,
  serviceName,
  servicePacks,
  serviceDetails,
  foodComponentVariants,
  selectedVariants,
  variantStocks,
  existingVariantStocks,
  updatingVariants,
  isLocked,
  onVariantToggle,
  onStockChange,
}: ServiceVariantsManagerProps) {
  const [packDetails, setPackDetails] = useState<Map<string, PackWithComponentsDto>>(new Map());
  const [loadingPacks, setLoadingPacks] = useState(false);

  // Load pack details for all packs in the service
  useEffect(() => {
    const loadPackDetails = async () => {
      if (servicePacks.length === 0) return;
      
      // If we have serviceDetails, we can get pack IDs from there
      // Otherwise load from servicePacks
      const packIds = serviceDetails
        ? serviceDetails.packs.map((sp) => sp.packId)
        : servicePacks.map((sp) => sp.packId);
      
      if (packIds.length === 0) return;
      
      setLoadingPacks(true);
      const detailsMap = new Map<string, PackWithComponentsDto>();
      
      for (const packId of packIds) {
        // Skip if already loaded
        if (packDetails.has(packId)) {
          detailsMap.set(packId, packDetails.get(packId)!);
          continue;
        }
        
        try {
          const packDetail = await apiClient.getPackById(packId);
          detailsMap.set(packId, packDetail);
        } catch (err) {
          console.error(`Failed to load pack ${packId}:`, err);
        }
      }
      
      setPackDetails(detailsMap);
      setLoadingPacks(false);
    };

    loadPackDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicePacks, serviceDetails]);

  // Build component map: componentId -> { componentName, packNames, required }
  const componentMap = new Map<
    string,
    { componentName: string; packNames: string[]; required: boolean }
  >();

  for (const [packId, packDetail] of packDetails.entries()) {
    const packName = servicePacks.find((sp) => sp.packId === packId)?.packName || packId;
    
    for (const packComponent of packDetail.components) {
      const existing = componentMap.get(packComponent.componentId);
      if (existing) {
        if (!existing.packNames.includes(packName)) {
          existing.packNames.push(packName);
        }
        // Component is required if it's required in any pack
        if (packComponent.required) {
          existing.required = true;
        }
      } else {
        componentMap.set(packComponent.componentId, {
          componentName: packComponent.componentName,
          packNames: [packName],
          required: packComponent.required,
        });
      }
    }
  }

  const getVariantStock = (variantId: string) => {
    // If variant is already in daily menu service, use its stock
    if (existingVariantStocks.has(variantId)) {
      return existingVariantStocks.get(variantId) || 50;
    }
    // Otherwise use local state (for new variants)
    return variantStocks.get(variantId) || 50;
  };

  if (loadingPacks) {
    return (
      <div className="ml-12 mt-3 mb-3 p-4 bg-surface-light border border-surface-dark rounded-lg">
        <div className="text-center py-4 text-gray-500">Loading pack details...</div>
      </div>
    );
  }

  const components = Array.from(componentMap.entries()).sort((a, b) =>
    a[1].componentName.localeCompare(b[1].componentName),
  );

  return (
    <div className="ml-12 mt-3 mb-3 p-4 bg-surface-light border border-surface-dark rounded-lg">
      <h3 className="font-semibold text-lg mb-2">{serviceName} - Variants</h3>
      <p className="text-sm text-gray-600 mb-4">
        Variants activated here apply to all packs in this service that have the corresponding component.
      </p>
      {components.length === 0 ? (
        <p className="text-gray-600 text-sm font-normal">No components found in service packs</p>
      ) : (
        <div className="space-y-6">
          {components.map(([componentId, componentInfo]) => {
            const variants = foodComponentVariants.get(componentId) || [];

            return (
              <div
                key={componentId}
                className="border-b border-surface-dark pb-4 last:border-b-0 last:pb-0"
              >
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{componentInfo.componentName}</h4>
                    {componentInfo.required && (
                      <span className="text-xs text-destructive">(Required)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Package className="h-3 w-3" />
                    <span>In packs: {componentInfo.packNames.join(', ')}</span>
                  </div>
                </div>
                {variants.length === 0 ? (
                  <p className="text-gray-600 text-sm font-normal">
                    No variants available for this component
                  </p>
                ) : (
                  <div className="space-y-2 ml-4">
                    {variants.map((variant) => {
                      const selected = selectedVariants.has(variant.id);
                      const stock = getVariantStock(variant.id);
                      const isUpdating = updatingVariants.has(variant.id);

                      return (
                        <VariantRow
                          key={variant.id}
                          variant={variant}
                          selected={selected}
                          stock={stock}
                          isUpdating={isUpdating}
                          isLocked={isLocked}
                          onToggle={(checked) => onVariantToggle(variant.id, checked, componentId)}
                          onStockChange={(newStock) => onStockChange(variant.id, newStock, selected)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
