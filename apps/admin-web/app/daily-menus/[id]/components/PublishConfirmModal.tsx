'use client';

import {
  Dialog,
  DialogContainer,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../../../components/ui-layouts/linear-modal';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmModal({ isOpen, onConfirm, onCancel }: PublishConfirmModalProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContainer>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <DialogClose className="text-gray-600 hover:text-gray-800" />
          <DialogTitle className="text-xl font-semibold mb-4">Publish Daily Menu?</DialogTitle>
          <DialogDescription className="text-gray-600 mb-4">
            This will make the daily menu available for ordering. Warnings (if any) will be displayed after publishing.
          </DialogDescription>
          <p className="text-sm text-gray-500 mb-6">
            Note: Warnings do not block publishing, but you should review them.
          </p>
          <div className="flex gap-2 justify-end">
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
          </div>
        </DialogContent>
      </DialogContainer>
    </Dialog>
  );
}
