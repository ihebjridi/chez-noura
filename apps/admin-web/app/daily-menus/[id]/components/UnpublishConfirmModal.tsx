'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../../../components/ui/dialog';

interface UnpublishConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnpublishConfirmModal({ isOpen, onConfirm, onCancel }: UnpublishConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-warning-700">Unpublish menu (reset to draft)?</DialogTitle>
          <DialogDescription>
            This will set the menu back to draft so you can add or change variants and components.
            The menu will no longer be visible to employees until you publish again.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-gray-500 mb-6">
          Only published menus can be unpublished. Existing orders are not affected.
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
            className="px-4 py-2 bg-warning-600 text-white rounded hover:bg-warning-700 transition-colors"
          >
            Unpublish
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
