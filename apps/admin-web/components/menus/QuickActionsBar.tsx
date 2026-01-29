'use client';

import { DailyMenuWithDetailsDto, DailyMenuStatus, ServiceDto } from '@contracts/core';
import { InlineToolbar } from '../layouts/InlineToolbar';
import { PublishConfirmModal } from '../../app/daily-menus/[id]/components/PublishConfirmModal';
import { DeleteConfirmModal } from '../../app/daily-menus/[id]/components/DeleteConfirmModal';

interface QuickActionsBarProps {
  dailyMenu: DailyMenuWithDetailsDto | null;
  allServices?: ServiceDto[];
  isReadOnly?: boolean;
  onPublish: () => void;
  onLock: () => void;
  onUnlock: () => void;
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
  allServices = [],
  isReadOnly = false,
  onPublish,
  onLock,
  onUnlock,
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

  // Collect service cutoff times for display
  const serviceCutoffTimes = dailyMenu.services
    .map((menuService) => {
      const service = allServices.find((s) => s.id === menuService.serviceId);
      return service?.cutoffTime || null;
    })
    .filter((time): time is string => time !== null);

  // Build info message showing service cutoff times
  const getInfoMessage = () => {
    if (isLocked) {
      return <span className="text-sm text-gray-600">Menu is locked and cannot be modified</span>;
    }

    if (serviceCutoffTimes.length > 0) {
      const uniqueCutoffs = [...new Set(serviceCutoffTimes)];
      if (uniqueCutoffs.length === 1) {
        return (
          <span className="text-sm text-gray-600">
            Service cutoff: <span className="font-medium">{uniqueCutoffs[0]}</span>
          </span>
        );
      } else {
        return (
          <span className="text-sm text-gray-600">
            Service cutoffs: <span className="font-medium">{uniqueCutoffs.join(', ')}</span>
          </span>
        );
      }
    }

    return (
      <span className="text-sm text-gray-500">
        Cutoff times are configured per service in the Services page
      </span>
    );
  };

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

  // Build secondary actions array
  const secondaryActions = [];
  
  if (isLocked) {
    // Unlock button for locked menus
    secondaryActions.push({
      label: 'Unlock Menu',
      onClick: onUnlock,
    });
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
            : isLocked
            ? undefined
            : isPublished
            ? {
                label: 'Close Orders',
                onClick: onLock,
              }
            : undefined
        }
        secondaryActions={secondaryActions.length > 0 ? secondaryActions : undefined}
        destructiveAction={
          isDraft
            ? {
                label: 'Delete',
                onClick: onDelete,
              }
            : undefined
        }
        info={getInfoMessage()}
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
