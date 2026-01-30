'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  BusinessDto,
  UpdateBusinessDto,
  EntityStatus,
  EmployeeDto,
  UserRole,
  BusinessServiceDto,
  ActivityLogDto,
  UpdateEmployeeDto,
} from '@contracts/core';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { Loading } from '../../../components/ui/loading';
import { StatusBadge } from '../../../components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
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
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import { formatDateTime } from '../../../lib/date-utils';
import { EmployeeListModal } from '../../../components/business/employee-list-modal';
import { EditEmployeeModal } from '../../../components/business/edit-employee-modal';
import { CredentialsModal } from '../../../components/business/credentials-modal';
import { AssignServiceModal } from '../../../components/business/assign-service-modal';
import { ServiceSubscriptions } from '../../../components/business/service-subscriptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useBreadcrumbSegment } from '../../../contexts/breadcrumb-context';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Employee with optional role (from list endpoint); satisfies TS when contract dist is stale */
function getEmployeeRole(employee: EmployeeDto): UserRole | undefined {
  return (employee as EmployeeDto & { role?: UserRole }).role;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<BusinessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [assignServiceModalOpen, setAssignServiceModalOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    businessName: string;
    email: string;
    password: string;
  }>({
    isOpen: false,
    businessName: '',
    email: '',
    password: '',
  });
  const [serviceSubscriptionsRefreshTrigger, setServiceSubscriptionsRefreshTrigger] = useState(0);

  // Set breadcrumb label
  useBreadcrumbSegment(businessId, business?.name);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const businessData = await apiClient.getBusinessById(businessId);
        if (cancelled) return;
        setBusiness(businessData);
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
  }, [businessId]);

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

  const handleUpdateEmployee = async (
    employeeId: string,
    data: UpdateEmployeeDto,
  ) => {
    if (!businessId) return;
    const updated = await apiClient.updateBusinessEmployee(
      businessId,
      employeeId,
      data,
    );
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, ...updated } : e)),
    );
  };

  const handleDeleteEmployee = async (employee: EmployeeDto) => {
    if (!businessId) return;
    const roleLabel =
      getEmployeeRole(employee) === UserRole.BUSINESS_ADMIN ? 'Admin' : 'Employee';
    const confirmed = window.confirm(
      `Delete ${employee.firstName} ${employee.lastName} (${employee.email})? This ${roleLabel} will be removed from the business. This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      setError('');
      await apiClient.deleteBusinessEmployee(businessId, employee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
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
    if (!businessId) return;
    setError('');
    try {
      setSaving(true);
      const updated = await apiClient.updateBusiness(
        businessId,
        updateData,
        logoFile || undefined,
      );
      setBusiness(updated);
      setUpdateData({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        status: updated.status,
      });
      setLogoFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update business');
    } finally {
      setSaving(false);
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
    } catch (err: any) {
      setError(err.message || 'Failed to update business status');
    }
  };

  const handleGeneratePassword = async () => {
    if (!businessId || !business) return;
    try {
      setError('');
      const result = await apiClient.generateBusinessAdminPassword(businessId);
      setCredentialsModal({
        isOpen: true,
        businessName: business.name,
        email: result.email,
        password: result.temporaryPassword,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate password');
    }
  };

  const handleDelete = async () => {
    if (!businessId || !business) return;
    if (confirm(`Are you sure you want to delete "${business.name}"? This only works if the business has no employees, orders, or invoices.`)) {
      try {
        setError('');
        await apiClient.deleteBusiness(businessId);
        router.push('/businesses');
      } catch (err: any) {
        setError(err.message || 'Failed to delete business. The business may have related records that prevent deletion.');
      }
    }
  };

  const handleForceDelete = async () => {
    if (!businessId || !business) return;
    const message =
      `This will permanently delete "${business.name}" and ALL related data:\n\n` +
      '• All employees\n• All orders\n• All invoices\n\nThis cannot be undone. Are you sure?';
    if (confirm(message)) {
      try {
        setError('');
        await apiClient.forceDeleteBusiness(businessId);
        router.push('/businesses');
      } catch (err: any) {
        setError(err.message || 'Failed to delete business.');
      }
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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Loading message="Loading business..." />
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-50 border border-error-200 px-3 py-2 text-sm text-error-700">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/businesses">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Businesses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-sm text-gray-500">Business not found.</div>
        <div className="mt-4">
          <Link href="/businesses">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Businesses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/businesses">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Businesses
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-error-50 border border-error-200 px-3 py-2 text-sm text-error-700">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 bg-surface border border-surface-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
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
              variant="ghost"
              size="sm"
              onClick={handleGeneratePassword}
              className="flex items-center gap-1"
            >
              <Key className="h-4 w-4" />
              Generate New Password
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete Business
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleForceDelete}
              className="flex items-center gap-1 border-error-300 bg-error-50 text-error-700 hover:bg-error-100"
              title="Permanently delete this business and all its employees, orders, and invoices"
            >
              <AlertTriangle className="h-4 w-4" />
              Delete business and all related data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="information" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="information">Business Information</TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="services">
              <Layers className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="information" className="bg-surface border border-surface-dark rounded-lg p-6">
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
                  value={updateData.name || ''}
                  onChange={(e) =>
                    setUpdateData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  placeholder="Enter business name"
                />
              </FormField>

              <FormField label="Email" required>
                <Input
                  type="email"
                  value={updateData.email || ''}
                  onChange={(e) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      email: e.target.value || undefined,
                    }))
                  }
                  required
                  placeholder="business@example.com"
                />
              </FormField>

              <FormField label="Phone">
                <Input
                  type="tel"
                  value={updateData.phone || ''}
                  onChange={(e) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      phone: e.target.value || undefined,
                    }))
                  }
                  placeholder="Business phone number"
                />
              </FormField>

              <FormField label="Address">
                <Textarea
                  value={updateData.address || ''}
                  onChange={(e) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      address: e.target.value || undefined,
                    }))
                  }
                  rows={3}
                  placeholder="Business address"
                />
              </FormField>

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

              <div className="flex gap-2 pt-4 border-t border-surface-dark">
                <Button type="button" variant="secondary" onClick={() => router.push('/businesses')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="employees" className="bg-surface border border-surface-dark rounded-lg p-6">
            <div className="mb-4">
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
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <span
                          className={
                            getEmployeeRole(employee) === UserRole.BUSINESS_ADMIN
                              ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200'
                              : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300'
                          }
                        >
                          {getEmployeeRole(employee) === UserRole.BUSINESS_ADMIN
                            ? 'Admin'
                            : 'Employee'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingEmployee(employee)}
                            aria-label="Edit employee"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee)}
                            aria-label="Delete employee"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="services" className="bg-surface border border-surface-dark rounded-lg p-6">
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
          </TabsContent>

          <TabsContent value="activity" className="bg-surface border border-surface-dark rounded-lg p-6">
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
          </TabsContent>
        </Tabs>
      </div>

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

      {/* Edit Employee Modal */}
      {businessId && (
        <EditEmployeeModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
          onSave={handleUpdateEmployee}
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
      />
    </>
  );
}
