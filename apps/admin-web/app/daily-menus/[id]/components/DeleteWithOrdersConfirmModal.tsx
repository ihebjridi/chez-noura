'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../../../components/ui/dialog';

interface DeleteWithOrdersConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteWithOrdersConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: DeleteWithOrdersConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete menu and all its orders (dev)?</DialogTitle>
          <DialogDescription>
            This will permanently delete this daily menu and every order placed for it. For dev use
            only. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
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
            Delete menu and orders
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
