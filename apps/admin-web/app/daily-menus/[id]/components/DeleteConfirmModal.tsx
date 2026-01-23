'use client';

import {
  Dialog,
  DialogContainer,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../../../components/ui-layouts/linear-modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ isOpen, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContainer>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <DialogClose className="text-gray-600 hover:text-gray-800" />
          <DialogTitle className="text-xl font-semibold mb-4 text-destructive">Delete Daily Menu?</DialogTitle>
          <DialogDescription className="text-gray-600 mb-4">
            Are you sure you want to delete this daily menu? This action cannot be undone.
          </DialogDescription>
          <p className="text-sm text-gray-500 mb-6">
            Only draft menus can be deleted. All associated packs and variants will be removed.
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
              className="px-4 py-2 bg-destructive text-white rounded hover:bg-destructive-hover transition-colors"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </DialogContainer>
    </Dialog>
  );
}
