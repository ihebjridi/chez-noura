'use client';

import { DailyMenuWithDetailsDto, DailyMenuStatus } from '@contracts/core';
import { InlineToolbar } from '../../components/layouts/InlineToolbar';
import { PublishConfirmModal } from '../daily-menus/[id]/components/PublishConfirmModal';
import { DeleteConfirmModal } from '../daily-menus/[id]/components/DeleteConfirmModal';
import { CutoffHourEditor } from './CutoffHourEditor';

interface QuickActionsBarProps {
  dailyMenu: DailyMenuWithDetailsDto | null;
  isReadOnly?: boolean;
  onPublish: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onChangeCutoff: (cutoffHour: string) => void;
  onDelete: () => void;
  showPublishConfirm: boolean;
  showDeleteConfirm: boolean;
  showCutoffEditor: boolean;
  onPublishConfirm: () => void;
  onPublishCancel: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onCutoffEditorOpen: () => void;
  onCutoffEditorClose: () => void;
}

export function QuickActionsBar({
  dailyMenu,
  isReadOnly = false,
  onPublish,
  onLock,
  onUnlock,
  onChangeCutoff,
  onDelete,
  showPublishConfirm,
  showDeleteConfirm,
  showCutoffEditor,
  onPublishConfirm,
  onPublishCancel,
  onDeleteConfirm,
  onDeleteCancel,
  onCutoffEditorOpen,
  onCutoffEditorClose,
}: QuickActionsBarProps) {
  if (!dailyMenu) {
    return null;
  }

  const isDraft = dailyMenu.status === DailyMenuStatus.DRAFT;
  const isPublished = dailyMenu.status === DailyMenuStatus.PUBLISHED;
  const isLocked = dailyMenu.status === DailyMenuStatus.LOCKED;
  
  // Use cutoffHour from menu, default to "14:00" if not set
  const cutoffHour = dailyMenu.cutoffHour || '14:00';
  const [cutoffHourPart, cutoffMinutePart] = cutoffHour.split(':');
  const cutoffTime = new Date(dailyMenu.date + `T${cutoffHourPart}:${cutoffMinutePart}:00`);
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

  // Build secondary actions array
  const secondaryActions = [];
  
  if (isLocked) {
    // Unlock button for locked menus
    secondaryActions.push({
      label: 'Unlock Menu',
      onClick: onUnlock,
    });
  } else if (isDraft || isPublished) {
    // Change Cutoff button for DRAFT and PUBLISHED menus
    secondaryActions.push({
      label: 'Change Cutoff',
      onClick: onCutoffEditorOpen,
    });
    
    // Lock button for published menus (if not already showing as primary)
    if (isPublished && !canLock) {
      secondaryActions.push({
        label: 'Close Orders',
        onClick: onLock,
        disabled: !canLock,
      });
    }
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
            : canLock
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

      <CutoffHourEditor
        isOpen={showCutoffEditor}
        currentCutoffHour={cutoffHour}
        onSave={(newCutoffHour) => {
          onChangeCutoff(newCutoffHour);
          onCutoffEditorClose();
        }}
        onCancel={onCutoffEditorClose}
      />
    </>
  );
}
