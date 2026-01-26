'use client';

import React, { useState } from 'react';
import { Button } from './button';

export interface CollapsibleFormProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  showHeader?: boolean;
}

export function CollapsibleForm({
  title,
  isOpen,
  onToggle,
  onSubmit,
  onCancel,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  showHeader = true,
}: CollapsibleFormProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (!isOpen) {
      onToggle();
    }
  };

  return (
    <div className="mb-6 bg-surface border border-surface-dark rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-surface-light transition-colors"
      >
        <span className="font-semibold">{title}</span>
        <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-surface-dark">
          {showHeader && (
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
          )}
          <form onSubmit={onSubmit}>
            {children}
            <div className="flex gap-2 mt-4">
              <Button type="submit" variant="primary">
                {submitLabel}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancel}>
                {cancelLabel}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
