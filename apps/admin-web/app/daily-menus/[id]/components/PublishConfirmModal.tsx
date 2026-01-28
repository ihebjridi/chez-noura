'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../../../components/ui/dialog';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmModal({ isOpen, onConfirm, onCancel }: PublishConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Daily Menu?</DialogTitle>
          <DialogDescription>
            This will make the daily menu available for ordering. Warnings (if any) will be displayed after publishing.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-500 mb-6">
          Note: Warnings do not block publishing, but you should review them.
        </p>
        <DialogFooter>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            Publish
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
