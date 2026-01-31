import { VariantDto } from '@contracts/core';
import { ToggleSwitch } from './ToggleSwitch';
import { getImageSrc } from '../../../../lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface VariantRowProps {
  variant: VariantDto;
  selected: boolean;
  stock: number;
  isUpdating: boolean;
  isLocked: boolean;
  onToggle: (checked: boolean) => void;
  onStockChange: (stock: number) => void;
}

export function VariantRow({
  variant,
  selected,
  stock,
  isUpdating,
  isLocked,
  onToggle,
  onStockChange,
}: VariantRowProps) {
  return (
    <div
      className={`flex items-center gap-4 p-3 border rounded ${
        selected ? 'bg-warning-50 border-warning-300' : 'bg-surface border-surface-dark'
      } ${isLocked ? 'opacity-60' : ''} ${isUpdating ? 'opacity-50' : ''}`}
    >
      <ToggleSwitch
        checked={selected}
        onChange={onToggle}
        disabled={isLocked || isUpdating}
        color="primary"
      />
      {variant.imageUrl ? (
        <img
          src={getImageSrc(variant.imageUrl, API_BASE_URL)}
          alt={variant.name}
          className="w-12 h-12 object-cover rounded-md border border-surface-dark flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-surface-light border border-surface-dark rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
          No image
        </div>
      )}
      <div className="flex-1 font-medium">{variant.name}</div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Stock:</label>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => onStockChange(parseInt(e.target.value) || 50)}
          disabled={isLocked}
          required={!selected}
          placeholder="50"
          className={`w-20 px-2 py-1 border rounded ${
            isLocked
              ? 'bg-surface-light border-surface-dark text-gray-600 cursor-not-allowed'
              : 'bg-background border-surface-dark focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
        />
        {isUpdating && <span className="text-xs text-gray-500">Updating...</span>}
        {selected && !isLocked && (
          <span className="text-xs text-primary-600" title="Stock changes are local only. Backend doesn't support updates.">
            (Local edit)
          </span>
        )}
      </div>
    </div>
  );
}
