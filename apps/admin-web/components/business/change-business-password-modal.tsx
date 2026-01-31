'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { X, Key } from 'lucide-react';

interface ChangeBusinessPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessId: string;
  onSuccess?: () => void;
  setError?: (msg: string) => void;
  setCredentialsModal?: (data: {
    isOpen: boolean;
    businessName: string;
    email: string;
    password: string;
  }) => void;
}

export function ChangeBusinessPasswordModal({
  isOpen,
  onClose,
  businessName,
  businessId,
  onSuccess,
  setError: setPageError,
  setCredentialsModal,
}: ChangeBusinessPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (setPageError) setPageError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const { apiClient } = await import('../../lib/api-client');
      const result = await apiClient.setBusinessAdminPassword(businessId, newPassword);
      onSuccess?.();
      if (setCredentialsModal) {
        setCredentialsModal({
          isOpen: true,
          businessName,
          email: result.email,
          password: newPassword,
        });
      }
      handleClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to set password';
      setError(msg);
      if (setPageError) setPageError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-surface-dark">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Change Business Password</h2>
              <p className="text-sm text-gray-600 mt-0.5">{businessName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-light rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 px-3 py-2 text-sm text-error-700">
              {error}
            </div>
          )}

          <FormField label="New password" required>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirm password" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter the password"
              autoComplete="new-password"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Set password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
