'use client';

import { BusinessDto, EntityStatus } from '@contracts/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { StatusBadge } from '../ui/status-badge';
import { Button } from '../ui/button';
import {
  Package,
  Users,
  Layers,
  Activity,
  Power,
  PowerOff,
  Key,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BusinessDetailModalProps {
  business: BusinessDto | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignService: () => void;
  onViewEmployees: () => void;
  onViewServices: () => void;
  onViewActivity: () => void;
  onDisable: () => void;
  onGeneratePassword: () => void;
  onDelete: () => void;
  onForceDelete?: () => void;
  isLoading?: boolean;
  hasFailedDelete?: boolean;
}

export function BusinessDetailModal({
  business,
  isOpen,
  onClose,
  onAssignService,
  onViewEmployees,
  onViewServices,
  onViewActivity,
  onDisable,
  onGeneratePassword,
  onDelete,
  onForceDelete,
  isLoading = false,
  hasFailedDelete = false,
}: BusinessDetailModalProps) {
  if (!business) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Business — {business.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Header with logo and name */}
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              <img
                src={`${API_BASE_URL}${business.logoUrl}`}
                alt={business.name}
                className="h-16 w-16 object-contain rounded-lg border border-surface-dark bg-white flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 bg-surface-light rounded-lg border border-surface-dark flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                No Logo
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
              <div className="mt-1">
                <StatusBadge status={business.status} />
              </div>
            </div>
          </div>

          {/* Contact & address */}
          <div className="grid grid-cols-1 gap-2 text-sm border-t border-surface-dark pt-4">
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-gray-900">{business.email}</p>
            </div>
            {business.phone && (
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium text-gray-900">{business.phone}</p>
              </div>
            )}
            {business.address && (
              <div>
                <span className="text-gray-500">Address</span>
                <p className="font-medium text-gray-900">{business.address}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-surface-dark pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onAssignService();
                }}
                disabled={isLoading}
                title="Assign Service"
                className="flex items-center gap-1"
              >
                <Package className="h-4 w-4" />
                Assign Service
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onViewEmployees();
                }}
                disabled={isLoading}
                title="View Employees"
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                Employees
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onViewServices();
                }}
                disabled={isLoading}
                title="View Services"
                className="flex items-center gap-1"
              >
                <Layers className="h-4 w-4" />
                Services
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onViewActivity();
                }}
                disabled={isLoading}
                title="View Activity Logs"
                className="flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                Activity
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onDisable();
                }}
                disabled={isLoading}
                title={business.status === EntityStatus.ACTIVE ? 'Disable' : 'Enable'}
                className={`flex items-center gap-1 ${
                  business.status === EntityStatus.ACTIVE
                    ? 'text-warning-600 hover:text-warning-700 hover:bg-warning-50'
                    : 'text-success-600 hover:text-success-700 hover:bg-success-50'
                }`}
              >
                {business.status === EntityStatus.ACTIVE ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                {business.status === EntityStatus.ACTIVE ? 'Disable' : 'Enable'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onGeneratePassword();
                }}
                disabled={isLoading}
                title="Generate New Password"
                className="flex items-center gap-1"
              >
                <Key className="h-4 w-4" />
                New Password
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                disabled={isLoading}
                title="Delete Business"
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              {hasFailedDelete && onForceDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onForceDelete();
                  }}
                  disabled={isLoading}
                  title="Force Delete"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Force Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
