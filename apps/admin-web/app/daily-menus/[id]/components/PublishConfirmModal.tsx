interface PublishConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmModal({ isOpen, onConfirm, onCancel }: PublishConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Publish Daily Menu?</h3>
        <p className="text-gray-600 mb-4">
          This will make the daily menu available for ordering. Warnings (if any) will be displayed after publishing.
        </p>
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
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
