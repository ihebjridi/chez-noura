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
    secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    danger: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  return (
    <div className={`inline-flex flex-col items-center border rounded-lg ${sizeClasses[size]} ${variantClasses[variant]}`}>
      <span className="text-xs font-medium opacity-75">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
