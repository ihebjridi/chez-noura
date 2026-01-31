'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  BusinessDto,
  CreateBusinessDto,
  UpdateBusinessDto,
  EntityStatus,
  EmployeeDto,
  BusinessServiceDto,
  ActivityLogDto,
} from '@contracts/core';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../ui/dialog';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { StatusBadge } from '../ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Users,
  Layers,
  Activity,
  Power,
  PowerOff,
  Key,
  Trash2,
  AlertTriangle,
  Package,
  Plus,
} from 'lucide-react';
import { formatDateTime } from '../../lib/date-utils';
import { EmployeeListModal } from './employee-list-modal';
import { CredentialsModal } from './credentials-modal';
import { AssignServiceModal } from './assign-service-modal';
import { ServiceSubscriptions } from './service-subscriptions';
import { CollapsibleSection } from '../ui/collapsible-section';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BusinessModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string | null;
  onSaved?: () => void;
  onDelete?: (businessId: string) => void;
  onForceDelete?: (businessId: string) => void;
  hasFailedDelete?: boolean;
}

export function BusinessModal({
  open,
  onClose,
  businessId,
  onSaved,
  onDelete,
  onForceDelete,
  hasFailedDelete = false,
}: BusinessModalProps) {
  const isCreate = businessId === null;

  const [business, setBusiness] = useState<BusinessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    adminEmail: '',
    email: '',
    phone: '',
    address: '',
  });
  const [updateData, setUpdateData] = useState<UpdateBusinessDto>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [businessServices, setBusinessServices] = useState<BusinessServiceDto[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogDto[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [assignServiceModalOpen, setAssignServiceModalOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    businessName: string;
    email: string;
    password: string;
    isTemporary?: boolean;
    expiresAt?: string;
  }>({
    isOpen: false,
    businessName: '',
    email: '',
    password: '',
  });
  const [serviceSubscriptionsRefreshTrigger, setServiceSubscriptionsRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isCreate) {
      setBusiness(null);
      setFormData({
        name: '',
        adminEmail: '',
        email: '',
        phone: '',
        address: '',
      });
      setUpdateData({});
      setLogoFile(null);
      setLogoPreview(null);
      setEmployees([]);
      setBusinessServices([]);
      setActivityLogs([]);
    }
  }, [open, businessId, isCreate]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (isCreate) {
          setLoading(false);
          return;
        }

        if (businessId) {
          const businessData = await apiClient.getBusinessById(businessId);
          if (cancelled) return;
          setBusiness(businessData);
          setFormData({
            name: businessData.name,
            adminEmail: businessData.email, // Use email as adminEmail for display
            email: businessData.email,
            phone: businessData.phone || '',
            address: businessData.address || '',
          });
          setUpdateData({
            name: businessData.name,
            email: businessData.email,
            phone: businessData.phone,
            address: businessData.address,
            status: businessData.status,
          });
          if (businessData.logoUrl) {
            setLogoPreview(`${API_BASE_URL}${businessData.logoUrl}`);
          }

          // Load related data
          await Promise.all([
            loadEmployees(),
            loadServices(),
            loadActivityLogs(),
          ]);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load business');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, businessId, isCreate]);

  const loadEmployees = async () => {
    if (!businessId) return;
    try {
      setLoadingEmployees(true);
      const data = await apiClient.getBusinessEmployees(businessId);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadServices = async () => {
    if (!businessId) return;
    try {
      setLoadingServices(true);
      const data = await apiClient.getBusinessServices(businessId);
      setBusinessServices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadActivityLogs = async () => {
    if (!businessId) return;
    try {
      setLoadingLogs(true);
      const data = await apiClient.getActivityLogsByBusiness(businessId, 50);
      setActivityLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isCreate) {
      try {
        setSaving(true);
        const result = await apiClient.createBusiness(formData, logoFile || undefined);
        setCredentialsModal({
          isOpen: true,
          businessName: result.business.name,
          email: result.adminCredentials.email,
          password: result.adminCredentials.temporaryPassword,
        });
        onSaved?.();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create business');
      } finally {
        setSaving(false);
      }
    } else if (businessId) {
      try {
        setSaving(true);
        const updated = await apiClient.updateBusiness(
          businessId,
          updateData,
          logoFile || undefined,
        );
        setBusiness(updated);
        setFormData({
          name: updated.name,
          adminEmail: updated.email,
          email: updated.email,
          phone: updated.phone || '',
          address: updated.address || '',
        });
        setUpdateData({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          address: updated.address,
          status: updated.status,
        });
        setLogoFile(null);
        onSaved?.();
      } catch (err: any) {
        setError(err.message || 'Failed to update business');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleStatusToggle = async () => {
    if (!businessId || !business) return;
    try {
      setError('');
      const updated =
        business.status === EntityStatus.ACTIVE
          ? await apiClient.disableBusiness(businessId)
          : await apiClient.enableBusiness(businessId);
      setBusiness(updated);
      setUpdateData((prev) => ({ ...prev, status: updated.status }));
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update business status');
    }
  };

  const handleGenerateTemporaryAccess = async () => {
    if (!businessId || !business) return;
    try {
      setError('');
      const result = await apiClient.generateBusinessAdminPassword(businessId);
      setCredentialsModal({
        isOpen: true,
        businessName: business.name,
        email: result.email,
        password: result.temporaryPassword,
        isTemporary: true,
        expiresAt: result.expiresAt,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate temporary access');
    }
  };

  const parseDetails = (details?: string): any => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  // Prevent parent modal from closing when child modals are open
  const hasChildModalOpen = employeeModalOpen || assignServiceModalOpen || credentialsModal.isOpen;

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(o) => {
          // Don't close if a child modal is open
          if (!o && !hasChildModalOpen) {
            onClose();
          }
        }}
      >
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreate ? 'New Business' : business ? business.name : 'Business'}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? 'Create a new business with admin credentials.'
                : 'View or edit this business and manage related data.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-error-50 border border-error-200 px-3 py-2 text-sm text-error-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8">
              <Loading message="Loading..." />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <CollapsibleSection
                title="Business Information"
                defaultOpen={true}
              >
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-16 w-16 object-contain rounded-lg border border-surface-dark bg-white"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-surface-light rounded-lg border border-surface-dark flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <FormField label="Logo">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                      </FormField>
                    </div>
                  </div>

                  <FormField label="Name" required>
                    <Input
                      type="text"
                      value={isCreate ? formData.name : updateData.name || ''}
                      onChange={(e) => {
                        if (isCreate) {
                          setFormData((prev) => ({ ...prev, name: e.target.value }));
                        } else {
                          setUpdateData((prev) => ({ ...prev, name: e.target.value }));
                        }
                      }}
                      required
                      placeholder="Enter business name"
                    />
                  </FormField>

                  {isCreate ? (
                    <FormField label="Admin Email" required>
                      <Input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            adminEmail: e.target.value,
                          }))
                        }
                        required
                        placeholder="admin@example.com"
                      />
                    </FormField>
                  ) : null}

                  <FormField label="Email" required={!isCreate}>
                    <Input
                      type="email"
                      value={isCreate ? formData.email || '' : updateData.email || ''}
                      onChange={(e) => {
                        if (isCreate) {
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value || undefined,
                          }));
                        } else {
                          setUpdateData((prev) => ({
                            ...prev,
                            email: e.target.value || undefined,
                          }));
                        }
                      }}
                      required={!isCreate}
                      placeholder="business@example.com"
                    />
                  </FormField>

                  <FormField label="Phone">
                    <Input
                      type="tel"
                      value={isCreate ? formData.phone || '' : updateData.phone || ''}
                      onChange={(e) => {
                        if (isCreate) {
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value || undefined,
                          }));
                        } else {
                          setUpdateData((prev) => ({
                            ...prev,
                            phone: e.target.value || undefined,
                          }));
                        }
                      }}
                      placeholder="Business phone number"
                    />
                  </FormField>

                  <FormField label="Address">
                    <Textarea
                      value={isCreate ? formData.address || '' : updateData.address || ''}
                      onChange={(e) => {
                        if (isCreate) {
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value || undefined,
                          }));
                        } else {
                          setUpdateData((prev) => ({
                            ...prev,
                            address: e.target.value || undefined,
                          }));
                        }
                      }}
                      rows={3}
                      placeholder="Business address"
                    />
                  </FormField>

                  {!isCreate && business && (
                    <FormField label="Status">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={business.status} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleStatusToggle}
                          className={
                            business.status === EntityStatus.ACTIVE
                              ? 'text-warning-600 hover:text-warning-700 hover:bg-warning-50'
                              : 'text-success-600 hover:text-success-700 hover:bg-success-50'
                          }
                        >
                          {business.status === EntityStatus.ACTIVE ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                      </div>
                    </FormField>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-surface-dark">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? 'Saving...' : isCreate ? 'Create Business' : 'Save'}
                    </Button>
                  </div>
                </form>
              </CollapsibleSection>

              {!isCreate && businessId && (
                <>
                  <CollapsibleSection
                    title="Employees"
                    icon={<Users className="h-4 w-4" />}
                    defaultOpen={false}
                  >
                    {loadingEmployees ? (
                      <Loading message="Loading employees..." />
                    ) : employees.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        No employees found.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">
                                {`${employee.firstName} ${employee.lastName}`}
                              </TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>
                                <StatusBadge status={employee.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEmployeeModalOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Users className="h-4 w-4" />
                        Manage Employees
                      </Button>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Services"
                    icon={<Layers className="h-4 w-4" />}
                    defaultOpen={false}
                  >
                    <ServiceSubscriptions
                      key={serviceSubscriptionsRefreshTrigger}
                      businessId={businessId}
                      refreshTrigger={serviceSubscriptionsRefreshTrigger}
                      onServiceActivated={() => {
                        setServiceSubscriptionsRefreshTrigger((prev) => prev + 1);
                        loadServices();
                      }}
                      onServiceDeactivated={() => {
                        setServiceSubscriptionsRefreshTrigger((prev) => prev + 1);
                        loadServices();
                      }}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Activity Logs"
                    icon={<Activity className="h-4 w-4" />}
                    defaultOpen={false}
                  >
                    {loadingLogs ? (
                      <Loading message="Loading activity logs..." />
                    ) : activityLogs.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        No activity logs found.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activityLogs.map((log) => {
                              const details = parseDetails(log.details);
                              return (
                                <TableRow key={log.id}>
                                  <TableCell className="whitespace-nowrap">
                                    <span className="text-sm font-medium text-gray-900">
                                      {log.action}
                                    </span>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <span className="text-sm text-gray-600">
                                      {formatDateTime(log.createdAt)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <span className="text-sm text-gray-600 font-mono">
                                      {log.ipAddress || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {details ? (
                                      <details className="cursor-pointer">
                                        <summary className="text-sm text-gray-600 hover:text-gray-900">
                                          View details
                                        </summary>
                                        <pre className="mt-2 text-xs bg-surface-dark p-2 rounded overflow-x-auto">
                                          {typeof details === 'string'
                                            ? details
                                            : JSON.stringify(details, null, 2)}
                                        </pre>
                                      </details>
                                    ) : (
                                      <span className="text-sm text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Quick Actions"
                    icon={<Package className="h-4 w-4" />}
                    defaultOpen={false}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setAssignServiceModalOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Package className="h-4 w-4" />
                        Assign Service
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEmployeeModalOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Users className="h-4 w-4" />
                        View Employees
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStatusToggle}
                        className={`flex items-center gap-1 ${
                          business?.status === EntityStatus.ACTIVE
                            ? 'text-warning-600 hover:text-warning-700 hover:bg-warning-50'
                            : 'text-success-600 hover:text-success-700 hover:bg-success-50'
                        }`}
                      >
                        {business?.status === EntityStatus.ACTIVE ? (
                          <>
                            <PowerOff className="h-4 w-4" />
                            Disable Business
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4" />
                            Enable Business
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateTemporaryAccess}
                        className="flex items-center gap-1"
                        title="Generate a temporary password to log in as this business. Does not change the business admin's real password."
                      >
                        <Key className="h-4 w-4" />
                        Generate temporary access
                      </Button>
                      {onDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => businessId && onDelete(businessId)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Business
                        </Button>
                      )}
                      {hasFailedDelete && onForceDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => businessId && onForceDelete(businessId)}
                          className="flex items-center gap-1"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Force Delete
                        </Button>
                      )}
                    </div>
                  </CollapsibleSection>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Employee List Modal */}
      {businessId && (
        <EmployeeListModal
          isOpen={employeeModalOpen}
          onClose={() => {
            setEmployeeModalOpen(false);
            loadEmployees();
          }}
          businessId={businessId}
          businessName={business?.name || ''}
          onLoadEmployees={apiClient.getBusinessEmployees}
        />
      )}

      {/* Assign Service Modal */}
      {businessId && (
        <AssignServiceModal
          isOpen={assignServiceModalOpen}
          onClose={() => {
            setAssignServiceModalOpen(false);
            setServiceSubscriptionsRefreshTrigger((prev) => prev + 1);
            loadServices();
          }}
          businessId={businessId}
          businessName={business?.name || ''}
          onServiceAssigned={() => {
            setServiceSubscriptionsRefreshTrigger((prev) => prev + 1);
            loadServices();
          }}
        />
      )}

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={credentialsModal.isOpen}
        onClose={() =>
          setCredentialsModal({ ...credentialsModal, isOpen: false })
        }
        businessName={credentialsModal.businessName}
        email={credentialsModal.email}
        password={credentialsModal.password}
        isTemporary={credentialsModal.isTemporary}
        expiresAt={credentialsModal.expiresAt}
      />
    </>
  );
}
