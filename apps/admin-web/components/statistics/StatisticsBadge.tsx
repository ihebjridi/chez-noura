'use client';

interface StatisticsBadgeProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function StatisticsBadge({ label, value, variant = 'primary', size = 'md' }: StatisticsBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const variantClasses = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    secondary: 'bg-gray-50 text-gray-700 border-gray-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`inline-flex flex-col items-center border rounded-lg ${sizeClasses[size]} ${variantClasses[variant]}`}>
      <span className="text-xs font-medium opacity-75">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
