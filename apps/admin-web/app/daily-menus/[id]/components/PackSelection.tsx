import { PackDto, PackWithComponentsDto, VariantDto } from '@contracts/core';
import { PackFoodComponentDto } from '../types';
import { ToggleSwitch } from './ToggleSwitch';
import { PackVariantsManager } from './PackVariantsManager';

interface PackSelectionProps {
  packs: PackDto[];
  selectedPackIds: Set<string>;
  expandedPacks: Set<string>;
  packDetails: Map<string, PackWithComponentsDto>;
  foodComponentVariants: Map<string, VariantDto[]>;
  selectedVariants: Set<string>;
  variantStocks: Map<string, number>;
  existingVariantStocks: Map<string, number>;
  updatingVariants: Set<string>;
  isLocked: boolean;
  isExpanded: boolean;
  onToggleSection: () => void;
  onPackToggle: (packId: string, checked: boolean) => void;
  onTogglePackVariants: (packId: string) => void;
  onVariantToggle: (variantId: string, checked: boolean, foodComponentId: string) => void;
  onStockChange: (variantId: string, stock: number, isExisting: boolean) => void;
}

export function PackSelection({
  packs,
  selectedPackIds,
  expandedPacks,
  packDetails,
  foodComponentVariants,
  selectedVariants,
  variantStocks,
  existingVariantStocks,
  updatingVariants,
  isLocked,
  isExpanded,
  onToggleSection,
  onPackToggle,
  onTogglePackVariants,
  onVariantToggle,
  onStockChange,
}: PackSelectionProps) {
  const getFoodComponentsForPack = (packId: string): PackFoodComponentDto[] => {
    const packDetail = packDetails.get(packId);
    if (!packDetail) return [];
    return [...packDetail.components].sort((a, b) => a.orderIndex - b.orderIndex);
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <button
        onClick={onToggleSection}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-xl font-semibold">Pack Selection</h2>
        <span className="text-gray-500">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200">
          {packs.length === 0 ? (
            <p className="text-gray-600">No packs available</p>
              ) : (
                <div className="space-y-3">
                  {packs.map((pack) => {
                    const selected = selectedPackIds.has(pack.id);

                return (
                  <div key={pack.id}>
                    <label
                      className={`flex items-center gap-3 p-3 border rounded transition-colors ${
                        selected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <ToggleSwitch
                        checked={selected}
                        onChange={(checked) => onPackToggle(pack.id, checked)}
                        disabled={isLocked}
                        color="blue"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{pack.name}</div>
                        <div className="text-sm text-gray-600">{pack.price.toFixed(2)} TND</div>
                      </div>
                      {selected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePackVariants(pack.id);
                          }}
                          disabled={isLocked}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            isLocked
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : expandedPacks.has(pack.id)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {expandedPacks.has(pack.id) ? 'Hide Variants' : 'Manage Variants'}
                        </button>
                      )}
                    </label>
                    {selected && expandedPacks.has(pack.id) && (
                      <PackVariantsManager
                        packName={pack.name}
                        foodComponents={getFoodComponentsForPack(pack.id)}
                        foodComponentVariants={foodComponentVariants}
                        selectedVariants={selectedVariants}
                        variantStocks={variantStocks}
                        existingVariantStocks={existingVariantStocks}
                        updatingVariants={updatingVariants}
                        isLocked={isLocked}
                        onVariantToggle={onVariantToggle}
                        onStockChange={onStockChange}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
