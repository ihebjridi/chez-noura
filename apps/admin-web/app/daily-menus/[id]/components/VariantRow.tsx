import { VariantDto } from '@contracts/core';
import { ToggleSwitch } from './ToggleSwitch';

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
        selected ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
      } ${isLocked ? 'opacity-60' : ''} ${isUpdating ? 'opacity-50' : ''}`}
    >
      <ToggleSwitch
        checked={selected}
        onChange={onToggle}
        disabled={isLocked || isUpdating}
        color="green"
      />
      <div className="flex-1 font-medium">{variant.name}</div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Stock:</label>
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => onStockChange(parseInt(e.target.value) || 0)}
          disabled={isLocked}
          required={!selected}
          placeholder="0"
          className={`w-20 px-2 py-1 border rounded ${
            isLocked
              ? 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-white border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'
          }`}
        />
        {isUpdating && <span className="text-xs text-gray-500">Updating...</span>}
        {selected && !isLocked && (
          <span className="text-xs text-amber-600" title="Stock changes are local only. Backend doesn't support updates.">
            (Local edit)
          </span>
        )}
      </div>
    </div>
  );
}
