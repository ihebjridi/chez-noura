'use client';

import { DailyMenuWithDetailsDto, DailyMenuStatus } from '@contracts/core';
import { InlineToolbar } from '../../components/layouts/InlineToolbar';
import { PublishConfirmModal } from '../daily-menus/[id]/components/PublishConfirmModal';
import { DeleteConfirmModal } from '../daily-menus/[id]/components/DeleteConfirmModal';

interface QuickActionsBarProps {
  dailyMenu: DailyMenuWithDetailsDto | null;
  isReadOnly?: boolean;
  onPublish: () => void;
  onLock: () => void;
  onDelete: () => void;
  showPublishConfirm: boolean;
  showDeleteConfirm: boolean;
  onPublishConfirm: () => void;
  onPublishCancel: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function QuickActionsBar({
  dailyMenu,
  isReadOnly = false,
  onPublish,
  onLock,
  onDelete,
  showPublishConfirm,
  showDeleteConfirm,
  onPublishConfirm,
  onPublishCancel,
  onDeleteConfirm,
  onDeleteCancel,
}: QuickActionsBarProps) {
  if (!dailyMenu) {
    return null;
  }

  const isDraft = dailyMenu.status === DailyMenuStatus.DRAFT;
  const isPublished = dailyMenu.status === DailyMenuStatus.PUBLISHED;
  const isLocked = dailyMenu.status === DailyMenuStatus.LOCKED;
  const cutoffTime = new Date(dailyMenu.date + 'T14:00:00');
  const canLock = isPublished && new Date() >= cutoffTime;

  const cutoffDisplay = cutoffTime.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // If read-only (past menu), hide all actions
  if (isReadOnly) {
    return (
      <InlineToolbar
        info={
          <span className="text-sm text-gray-600">
            This is a past menu and is read-only. No modifications are allowed.
          </span>
        }
      />
    );
  }

  return (
    <>
      <InlineToolbar
        primaryAction={
          isDraft
            ? {
                label: 'Publish Menu',
                onClick: onPublish,
              }
            : canLock
            ? {
                label: 'Close Orders',
                onClick: onLock,
              }
            : undefined
        }
        secondaryActions={
          canLock && !isDraft
            ? undefined
            : isDraft
            ? [
                {
                  label: 'Close Orders',
                  onClick: onLock,
                  disabled: !canLock,
                },
              ]
            : undefined
        }
        destructiveAction={
          isDraft
            ? {
                label: 'Delete',
                onClick: onDelete,
              }
            : undefined
        }
        info={
          isLocked ? (
            <span className="text-sm text-gray-600">Menu is locked and cannot be modified</span>
          ) : (
            <span className="text-sm text-gray-600">
              Cutoff: <span className="font-medium">{cutoffDisplay}</span>
            </span>
          )
        }
      />

      <PublishConfirmModal
        isOpen={showPublishConfirm}
        onConfirm={onPublishConfirm}
        onCancel={onPublishCancel}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </>
  );
}
