import { VariantDto } from '@contracts/core';
import { PackFoodComponentDto } from '../types';
import { VariantRow } from './VariantRow';

interface PackVariantsManagerProps {
  packName: string;
  foodComponents: PackFoodComponentDto[];
  foodComponentVariants: Map<string, VariantDto[]>;
  selectedVariants: Set<string>;
  variantStocks: Map<string, number>;
  existingVariantStocks: Map<string, number>;
  updatingVariants: Set<string>;
  isLocked: boolean;
  onVariantToggle: (variantId: string, checked: boolean, foodComponentId: string) => void;
  onStockChange: (variantId: string, stock: number, isExisting: boolean) => void;
}

export function PackVariantsManager({
  packName,
  foodComponents,
  foodComponentVariants,
  selectedVariants,
  variantStocks,
  existingVariantStocks,
  updatingVariants,
  isLocked,
  onVariantToggle,
  onStockChange,
}: PackVariantsManagerProps) {
  const getVariantStock = (variantId: string) => {
    // If variant is already in daily menu, use its stock
    if (existingVariantStocks.has(variantId)) {
      return existingVariantStocks.get(variantId) || 0;
    }
    // Otherwise use local state (for new variants)
    return variantStocks.get(variantId) || 0;
  };

  return (
    <div className="ml-12 mt-3 mb-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="font-semibold text-lg mb-4">{packName} - Variants</h3>
      <div className="space-y-6">
        {foodComponents.map((foodComponent) => {
          const variants = foodComponentVariants.get(foodComponent.componentId) || [];

          return (
            <div key={foodComponent.componentId} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <div className="mb-3">
                <h4 className="font-semibold">{foodComponent.componentName}</h4>
                {foodComponent.required && <span className="text-xs text-red-600">(Required)</span>}
              </div>
              {variants.length === 0 ? (
                <p className="text-gray-500 text-sm">No variants available for this food component</p>
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
                        onToggle={(checked) => onVariantToggle(variant.id, checked, foodComponent.componentId)}
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
    </div>
  );
}
