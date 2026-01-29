'use client';

import { useState, useEffect } from 'react';
import { EmployeeDto } from '@contracts/core';
import { Loading } from '../ui/loading';
import { Error } from '../ui/error';
import { Empty } from '../ui/empty';
import { StatusBadge } from '../ui/status-badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { formatDateTime } from '../../lib/date-utils';
import { X } from 'lucide-react';

interface EmployeeListModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onLoadEmployees: (businessId: string) => Promise<EmployeeDto[]>;
}

export function EmployeeListModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  onLoadEmployees,
}: EmployeeListModalProps) {
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && businessId) {
      loadEmployees();
    } else {
      // Reset state when modal closes
      setEmployees([]);
      setError('');
    }
  }, [isOpen, businessId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await onLoadEmployees(businessId);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
            <p className="text-sm text-gray-600 mt-1">{businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-surface-light rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <Loading message="Loading employees..." />
          ) : error ? (
            <Error message={error} onRetry={loadEmployees} />
          ) : employees.length === 0 ? (
            <Empty
              message="No employees found"
              description="This business has no employees yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm text-gray-600">{employee.email}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {formatDateTime(employee.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-dark">
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
