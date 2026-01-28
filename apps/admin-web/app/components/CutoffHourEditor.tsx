'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/ui/dialog';

interface CutoffHourEditorProps {
  isOpen: boolean;
  currentCutoffHour?: string;
  onSave: (cutoffHour: string) => void;
  onCancel: () => void;
}

export function CutoffHourEditor({
  isOpen,
  currentCutoffHour = '14:00',
  onSave,
  onCancel,
}: CutoffHourEditorProps) {
  const [cutoffHour, setCutoffHour] = useState(currentCutoffHour);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCutoffHour(currentCutoffHour);
      setError('');
    }
  }, [isOpen, currentCutoffHour]);

  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSave = () => {
    if (!cutoffHour.trim()) {
      setError('Cutoff hour is required');
      return;
    }

    if (!validateTime(cutoffHour)) {
      setError('Invalid time format. Please use HH:MM format (24-hour, e.g., 14:00)');
      return;
    }

    setError('');
    onSave(cutoffHour);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Cutoff Hour</DialogTitle>
          <DialogDescription>
            Set the cutoff hour for this menu. Orders cannot be placed after this time.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <label htmlFor="cutoff-hour" className="block text-sm font-medium text-gray-700 mb-2">
            Cutoff Hour (24-hour format)
          </label>
          <input
            id="cutoff-hour"
            type="time"
            value={cutoffHour}
            onChange={(e) => {
              setCutoffHour(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="14:00"
          />
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Format: HH:MM (24-hour format, e.g., 14:00 for 2:00 PM)
          </p>
        </div>

        <DialogFooter>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
