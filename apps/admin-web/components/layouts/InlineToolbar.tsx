'use client';

import { ReactNode } from 'react';

interface InlineToolbarProps {
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  destructiveAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  info?: ReactNode;
  className?: string;
}

export function InlineToolbar({
  primaryAction,
  secondaryActions,
  destructiveAction,
  info,
  className = '',
}: InlineToolbarProps) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 px-4 bg-surface-light border-b border-surface-dark ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {info && <div className="text-sm text-gray-600">{info}</div>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {secondaryActions?.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            disabled={action.disabled}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-surface hover:bg-surface-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action.label}
          </button>
        ))}

        {destructiveAction && (
          <button
            onClick={destructiveAction.onClick}
            disabled={destructiveAction.disabled}
            className="px-4 py-1.5 text-sm font-medium text-white bg-destructive hover:bg-destructive-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {destructiveAction.label}
          </button>
        )}

        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
