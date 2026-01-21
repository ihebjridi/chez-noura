import { DailyMenuWithDetailsDto, DailyMenuStatus } from '@contracts/core';
import { StatusBadge } from './StatusBadge';
import Link from 'next/link';

interface DailyMenuHeaderProps {
  dailyMenu: DailyMenuWithDetailsDto;
  isDraft: boolean;
  canLock: boolean;
  onPublishClick: () => void;
  onLockClick: () => void;
  onLogout: () => void;
}

export function DailyMenuHeader({
  dailyMenu,
  isDraft,
  canLock,
  onPublishClick,
  onLockClick,
  onLogout,
}: DailyMenuHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const cutoffTime = new Date(dailyMenu.date + 'T14:00:00').toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mb-8">
      <Link href="/daily-menus" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Daily Menus
      </Link>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Daily Menu Editor</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="font-medium">{formatDate(dailyMenu.date)}</span>
            <StatusBadge status={dailyMenu.status} />
            <span>Cutoff: {cutoffTime}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={onPublishClick}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Publish Menu
            </button>
          )}
          {canLock && (
            <button
              onClick={onLockClick}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Lock Menu
            </button>
          )}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
