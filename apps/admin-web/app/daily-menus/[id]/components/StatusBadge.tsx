import { DailyMenuStatus } from '@contracts/core';

interface StatusBadgeProps {
  status: DailyMenuStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusBadgeColor = (status: DailyMenuStatus) => {
    switch (status) {
      case DailyMenuStatus.DRAFT:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case DailyMenuStatus.PUBLISHED:
        return 'bg-primary-50 text-primary-700 border-primary-200';
      case DailyMenuStatus.LOCKED:
        return 'bg-warning-50 text-warning-700 border-warning-200';
      default:
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
        status,
      )}`}
    >
      {status}
    </span>
  );
}
