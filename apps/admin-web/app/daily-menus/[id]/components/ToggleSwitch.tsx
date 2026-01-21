interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'blue' | 'green';
}

export function ToggleSwitch({ checked, onChange, disabled = false, color = 'blue' }: ToggleSwitchProps) {
  const colorClasses = {
    blue: checked ? 'bg-blue-600' : 'bg-gray-300',
    green: checked ? 'bg-green-600' : 'bg-gray-300',
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          colorClasses[color]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  );
}
