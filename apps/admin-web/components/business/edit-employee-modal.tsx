'use client';

import { useState, useEffect } from 'react';
import { EmployeeDto, EntityStatus, UpdateEmployeeDto } from '@contracts/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDto | null;
  onSave: (employeeId: string, data: UpdateEmployeeDto) => Promise<void>;
}

const STATUS_OPTIONS: { value: EntityStatus; label: string }[] = [
  { value: EntityStatus.ACTIVE, label: 'Active' },
  { value: EntityStatus.INACTIVE, label: 'Inactive' },
  { value: EntityStatus.SUSPENDED, label: 'Suspended' },
];

export function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSave,
}: EditEmployeeModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<EntityStatus>(EntityStatus.ACTIVE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName);
      setLastName(employee.lastName);
      setStatus(employee.status as EntityStatus);
      setError('');
    }
  }, [employee]);

  if (!employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setSaving(true);
      await onSave(employee.id, { firstName, lastName, status });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Email:</span> {employee.email}
              <span className="text-gray-400 ml-1">(read-only)</span>
            </div>
            <FormField label="First name">
              <Input
                id="edit-employee-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Last name">
              <Input
                id="edit-employee-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Status">
              <select
                id="edit-employee-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EntityStatus)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
