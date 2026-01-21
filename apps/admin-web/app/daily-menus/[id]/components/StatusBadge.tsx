import { DailyMenuStatus } from '@contracts/core';

interface StatusBadgeProps {
  status: DailyMenuStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusBadgeColor = (status: DailyMenuStatus) => {
    switch (status) {
      case DailyMenuStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case DailyMenuStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 border-green-300';
      case DailyMenuStatus.LOCKED:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
