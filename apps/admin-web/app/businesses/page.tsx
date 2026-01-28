'use client';

import { useState, useEffect } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import { CreateBusinessDto, ActivityLogDto, EntityStatus } from '@contracts/core';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { Error } from '../../components/ui/error';
import { PageHeader } from '../../components/ui/page-header';
import { CollapsibleForm } from '../../components/ui/collapsible-form';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { StatusBadge } from '../../components/ui/status-badge';
import { Button } from '../../components/ui/button';
import { EmployeeListModal } from '../../components/business/employee-list-modal';
import { CredentialsModal } from '../../components/business/credentials-modal';
import { apiClient } from '../../lib/api-client';
import { formatDateTime } from '../../lib/date-utils';
import { 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Activity, 
  Users, 
  Power, 
  PowerOff,
  Key,
  AlertTriangle
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function BusinessesPage() {
  const { 
    businesses, 
    loading, 
    error, 
    loadBusinesses, 
    createBusiness, 
    deleteBusiness,
    disableBusiness,
    enableBusiness,
    forceDeleteBusiness,
    getBusinessEmployees,
    setError 
  } = useBusinesses();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    adminEmail: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [generatingPassword, setGeneratingPassword] = useState<string | null>(null);
  const [businessToGeneratePassword, setBusinessToGeneratePassword] = useState<{ id: string; name: string } | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<string | null>(null);
  const [disablingBusiness, setDisablingBusiness] = useState<string | null>(null);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string; name: string; errorMessage?: string } | null>(null);
  const [businessToForceDelete, setBusinessToForceDelete] = useState<{ id: string; name: string } | null>(null);
  const [businessToDisable, setBusinessToDisable] = useState<{ id: string; name: string; status: EntityStatus } | null>(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedBusinessForEmployees, setSelectedBusinessForEmployees] = useState<{ id: string; name: string } | null>(null);
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
  const [businessesWithFailedDelete, setBusinessesWithFailedDelete] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedActivityLogs, setExpandedActivityLogs] = useState<Set<string>>(new Set());
  const [activityLogsByBusiness, setActivityLogsByBusiness] = useState<Map<string, ActivityLogDto[]>>(new Map());
  const [loadingLogsByBusiness, setLoadingLogsByBusiness] = useState<Set<string>>(new Set());
  const [errorLogsByBusiness, setErrorLogsByBusiness] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const result = await createBusiness(formData, logoFile || undefined);
      setShowCreateForm(false);
      setFormData({ name: '', adminEmail: '' });
      setLogoFile(null);
      setLogoPreview(null);
      // Show credentials modal
      setCredentialsModal({
        isOpen: true,
        businessName: result.business.name,
        email: result.adminCredentials.email,
        password: result.adminCredentials.temporaryPassword,
      });
    } catch (err: any) {
      // Error is already set by the hook
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

  const handleGeneratePasswordClick = (business: { id: string; name: string }) => {
    setBusinessToGeneratePassword(business);
  };

  const handleGeneratePasswordConfirm = async () => {
    if (!businessToGeneratePassword) return;
    
    try {
      setGeneratingPassword(businessToGeneratePassword.id);
      setError('');
      const result = await apiClient.generateBusinessAdminPassword(businessToGeneratePassword.id);
      setBusinessToGeneratePassword(null);
      // Show credentials modal
      setCredentialsModal({
        isOpen: true,
        businessName: businessToGeneratePassword.name,
        email: result.email,
        password: result.temporaryPassword,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate new password');
    } finally {
      setGeneratingPassword(null);
    }
  };

  const handleGeneratePasswordCancel = () => {
    setBusinessToGeneratePassword(null);
  };

  const handleViewEmployees = (business: { id: string; name: string }) => {
    setSelectedBusinessForEmployees(business);
    setEmployeeModalOpen(true);
  };

  const handleDisableClick = (business: { id: string; name: string; status: EntityStatus }) => {
    setBusinessToDisable(business);
  };

  const handleDisableConfirm = async () => {
    if (!businessToDisable) return;
    
    try {
      setDisablingBusiness(businessToDisable.id);
      setError('');
      if (businessToDisable.status === EntityStatus.ACTIVE) {
        await disableBusiness(businessToDisable.id);
        setError(`Business "${businessToDisable.name}" disabled successfully.`);
      } else {
        await enableBusiness(businessToDisable.id);
        setError(`Business "${businessToDisable.name}" enabled successfully.`);
      }
      setBusinessToDisable(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update business status');
    } finally {
      setDisablingBusiness(null);
    }
  };

  const handleDisableCancel = () => {
    setBusinessToDisable(null);
  };

  const handleDeleteClick = (business: { id: string; name: string }) => {
    setBusinessToDelete(business);
  };

  const handleDeleteConfirm = async () => {
    if (!businessToDelete) return;
    
    try {
      setDeletingBusiness(businessToDelete.id);
      setError('');
      await deleteBusiness(businessToDelete.id);
      // Remove from failed delete set if it was there
      setBusinessesWithFailedDelete((prev) => {
        const newSet = new Set(prev);
        newSet.delete(businessToDelete.id);
        return newSet;
      });
      setBusinessToDelete(null);
      setError(`Business "${businessToDelete.name}" deleted successfully.`);
    } catch (err: any) {
      // Mark this business as having a failed delete attempt
      setBusinessesWithFailedDelete((prev) => new Set(prev).add(businessToDelete.id));
      // Keep the modal open and show the error, with option to force delete
      setBusinessToDelete({
        ...businessToDelete,
        errorMessage: err.message || 'Failed to delete business',
      });
      setError(err.message || 'Failed to delete business. Use force delete if you want to remove all related records.');
    } finally {
      setDeletingBusiness(null);
    }
  };

  const handleDeleteCancel = () => {
    setBusinessToDelete(null);
  };

  const handleDeleteModalForceDelete = () => {
    if (!businessToDelete) return;
    setBusinessToForceDelete({ id: businessToDelete.id, name: businessToDelete.name });
    setBusinessToDelete(null);
  };

  const handleForceDeleteClick = (business: { id: string; name: string }) => {
    setBusinessToForceDelete(business);
  };

  const handleForceDeleteConfirm = async () => {
    if (!businessToForceDelete) return;
    
    try {
      setDeletingBusiness(businessToForceDelete.id);
      setError('');
      await forceDeleteBusiness(businessToForceDelete.id);
      // Remove from failed delete set
      setBusinessesWithFailedDelete((prev) => {
        const newSet = new Set(prev);
        newSet.delete(businessToForceDelete.id);
        return newSet;
      });
      setBusinessToForceDelete(null);
      setError(`Business "${businessToForceDelete.name}" and all related records deleted successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to force delete business');
    } finally {
      setDeletingBusiness(null);
    }
  };

  const handleForceDeleteCancel = () => {
    setBusinessToForceDelete(null);
  };

  const toggleRow = (businessId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(businessId)) {
        newSet.delete(businessId);
        setExpandedActivityLogs((prevLogs) => {
          const newLogs = new Set(prevLogs);
          newLogs.delete(businessId);
          return newLogs;
        });
      } else {
        newSet.add(businessId);
      }
      return newSet;
    });
  };

  const toggleActivityLogs = async (businessId: string) => {
    const isExpanded = expandedActivityLogs.has(businessId);
    if (isExpanded) {
      setExpandedActivityLogs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    } else {
      setExpandedActivityLogs((prev) => {
        const newSet = new Set(prev);
        newSet.add(businessId);
        return newSet;
      });
      
      if (!activityLogsByBusiness.has(businessId)) {
        setLoadingLogsByBusiness((prev) => new Set(prev).add(businessId));
        setErrorLogsByBusiness((prev) => {
          const newMap = new Map(prev);
          newMap.delete(businessId);
          return newMap;
        });
        
        try {
          const logs = await apiClient.getActivityLogsByBusiness(businessId, 100);
          setActivityLogsByBusiness((prev) => {
            const newMap = new Map(prev);
            newMap.set(businessId, logs);
            return newMap;
          });
        } catch (err: any) {
          setErrorLogsByBusiness((prev) => {
            const newMap = new Map(prev);
            newMap.set(businessId, err.message || 'Failed to load activity logs');
            return newMap;
          });
        } finally {
          setLoadingLogsByBusiness((prev) => {
            const newSet = new Set(prev);
            newSet.delete(businessId);
            return newSet;
          });
        }
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Businesses"
        description="Manage businesses and their administrators"
      />

      {error && (
        <div className="mb-6">
          <Error message={error} onRetry={loadBusinesses} />
        </div>
      )}

      <CollapsibleForm
        title="Create New Business"
        isOpen={showCreateForm}
        onToggle={() => setShowCreateForm(!showCreateForm)}
        onSubmit={handleCreate}
        onCancel={() => {
          setShowCreateForm(false);
          setFormData({ name: '', adminEmail: '' });
          setLogoFile(null);
          setLogoPreview(null);
        }}
        submitLabel="Create Business"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Business Name" required>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter business name"
            />
          </FormField>
          <FormField
            label="Admin Email"
            required
            helpText="A temporary password will be generated for this admin user. This email will also be used as the business email if not specified separately."
          >
            <Input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
              placeholder="admin@example.com"
            />
          </FormField>
          <FormField label="Business Email (Optional)" className="md:col-span-2">
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value || undefined })}
              placeholder="Leave empty to use admin email"
            />
          </FormField>
          <FormField label="Phone (Optional)">
            <Input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value || undefined })}
              placeholder="Business phone number"
            />
          </FormField>
          <FormField label="Address (Optional)">
            <Textarea
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value || undefined })}
              rows={3}
              placeholder="Business address"
            />
          </FormField>
          <FormField label="Logo (Optional)" className="md:col-span-2">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {logoPreview && (
              <div className="mt-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-32 h-32 object-contain rounded-md border border-surface-dark bg-white"
                />
              </div>
            )}
          </FormField>
        </div>
      </CollapsibleForm>

      {loading ? (
        <Loading message="Loading businesses..." />
      ) : businesses.length === 0 ? (
        <Empty
          message="No businesses found"
          description="Create your first business to get started."
        />
      ) : (
        <div className="mt-6 bg-surface border border-surface-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    {/* Expand column */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Logo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-surface-dark">
                {businesses.map((business) => {
                  const isExpanded = expandedRows.has(business.id);
                  const isActivityLogsExpanded = expandedActivityLogs.has(business.id);
                  const isLoading = generatingPassword === business.id || 
                                   deletingBusiness === business.id || 
                                   disablingBusiness === business.id;
                  
                  return (
                    <>
                      <tr 
                        key={business.id} 
                        className="hover:bg-surface-light transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => toggleRow(business.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {business.logoUrl ? (
                            <img
                              src={`${API_BASE_URL}${business.logoUrl}`}
                              alt={business.name}
                              className="h-12 w-12 object-contain rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-surface-light rounded flex items-center justify-center text-gray-400 text-xs">
                              No Logo
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                          {business.address && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                              {business.address}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.phone || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={business.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewEmployees(business)}
                              disabled={isLoading}
                              className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="View Employees"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDisableClick(business)}
                              disabled={isLoading}
                              className={`p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                business.status === EntityStatus.ACTIVE
                                  ? 'text-warning-600 hover:text-warning-700 hover:bg-warning-50'
                                  : 'text-success-600 hover:text-success-700 hover:bg-success-50'
                              }`}
                              title={business.status === EntityStatus.ACTIVE ? 'Disable Business' : 'Enable Business'}
                            >
                              {business.status === EntityStatus.ACTIVE ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleGeneratePasswordClick(business)}
                              disabled={isLoading}
                              className="p-2 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Generate New Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleActivityLogs(business.id)}
                              disabled={isLoading}
                              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="View Activity Logs"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(business)}
                              disabled={isLoading}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Business"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {businessesWithFailedDelete.has(business.id) && (
                              <button
                                onClick={() => handleForceDeleteClick(business)}
                                disabled={isLoading}
                                className="p-2 text-red-800 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Force Delete Business"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row Content */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-surface-light">
                            <div className="space-y-4">
                              {/* Activity Logs Section */}
                              {isActivityLogsExpanded && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-4 h-4 text-gray-600" />
                                    <h4 className="text-sm font-semibold text-gray-900">Activity Logs</h4>
                                  </div>
                                  {loadingLogsByBusiness.has(business.id) ? (
                                    <Loading message="Loading activity logs..." />
                                  ) : errorLogsByBusiness.has(business.id) ? (
                                    <Error message={errorLogsByBusiness.get(business.id) || 'Failed to load activity logs'} />
                                  ) : (() => {
                                    const businessLogs = activityLogsByBusiness.get(business.id) || [];
                                    return businessLogs.length === 0 ? (
                                      <Empty
                                        message="No activity logs found"
                                        description="Activity logs will appear here when actions are performed."
                                      />
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                          <thead className="bg-surface">
                                            <tr>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Timestamp
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IP Address
                                              </th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-surface divide-y divide-surface-dark">
                                            {businessLogs.map((log) => {
                                              const details = parseDetails(log.details);
                                              return (
                                                <tr key={log.id} className="hover:bg-surface-light">
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{log.action}</span>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">
                                                      {formatDateTime(log.createdAt)}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600 font-mono">
                                                      {log.ipAddress || '-'}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    {details ? (
                                                      <details className="cursor-pointer">
                                                        <summary className="text-sm text-gray-600 hover:text-gray-900">
                                                          View details
                                                        </summary>
                                                        <pre className="mt-2 text-xs bg-surface-dark p-2 rounded overflow-x-auto">
                                                          {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                                                        </pre>
                                                      </details>
                                                    ) : (
                                                      <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee List Modal */}
      {selectedBusinessForEmployees && (
        <EmployeeListModal
          isOpen={employeeModalOpen}
          onClose={() => {
            setEmployeeModalOpen(false);
            setSelectedBusinessForEmployees(null);
          }}
          businessId={selectedBusinessForEmployees.id}
          businessName={selectedBusinessForEmployees.name}
          onLoadEmployees={getBusinessEmployees}
        />
      )}

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={credentialsModal.isOpen}
        onClose={() => setCredentialsModal({ ...credentialsModal, isOpen: false })}
        businessName={credentialsModal.businessName}
        email={credentialsModal.email}
        password={credentialsModal.password}
      />

      {/* Disable/Enable Confirmation Modal */}
      {businessToDisable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {businessToDisable.status === EntityStatus.ACTIVE ? 'Disable Business' : 'Enable Business'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {businessToDisable.status === EntityStatus.ACTIVE ? 'disable' : 'enable'}{' '}
              <strong>{businessToDisable.name}</strong>?{' '}
              {businessToDisable.status === EntityStatus.ACTIVE 
                ? 'This will prevent the business admin and employees from accessing the platform, but all data will be preserved.'
                : 'This will restore access to the platform for the business admin and employees.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                size="md"
                onClick={handleDisableCancel}
                disabled={disablingBusiness === businessToDisable.id}
              >
                Cancel
              </Button>
              <Button
                variant={businessToDisable.status === EntityStatus.ACTIVE ? 'danger' : 'primary'}
                size="md"
                onClick={handleDisableConfirm}
                disabled={disablingBusiness === businessToDisable.id}
              >
                {disablingBusiness === businessToDisable.id 
                  ? (businessToDisable.status === EntityStatus.ACTIVE ? 'Disabling...' : 'Enabling...')
                  : (businessToDisable.status === EntityStatus.ACTIVE ? 'Disable' : 'Enable')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Password Confirmation Modal */}
      {businessToGeneratePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Password</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to generate a new password for <strong>{businessToGeneratePassword.name}</strong>? 
              The current password will be invalidated and a new temporary password will be generated for the business admin.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                size="md"
                onClick={handleGeneratePasswordCancel}
                disabled={generatingPassword === businessToGeneratePassword.id}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGeneratePasswordConfirm}
                disabled={generatingPassword === businessToGeneratePassword.id}
              >
                {generatingPassword === businessToGeneratePassword.id ? 'Generating...' : 'Generate Password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {businessToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Business</h3>
            {businessToDelete.errorMessage ? (
              <>
                <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-error-700 mb-2">
                    <strong>Error:</strong> {businessToDelete.errorMessage}
                  </p>
                  <p className="text-sm text-error-600">
                    The business cannot be deleted because it has related records. Use force delete to remove all related data.
                  </p>
                </div>
                <p className="text-gray-600 mb-6">
                  Would you like to force delete <strong>{businessToDelete.name}</strong>? This will permanently delete all related records including users, employees, orders, and invoices.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleDeleteCancel}
                    disabled={deletingBusiness === businessToDelete.id}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleDeleteModalForceDelete}
                    disabled={deletingBusiness === businessToDelete.id}
                  >
                    Force Delete
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{businessToDelete.name}</strong>? 
                  This action cannot be undone. The business can only be deleted if it has no related records (users, employees, orders, invoices).
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleDeleteCancel}
                    disabled={deletingBusiness === businessToDelete.id}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleDeleteConfirm}
                    disabled={deletingBusiness === businessToDelete.id}
                  >
                    {deletingBusiness === businessToDelete.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Force Delete Confirmation Modal */}
      {businessToForceDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-error-600" />
              <h3 className="text-lg font-semibold text-gray-900">Force Delete Business</h3>
            </div>
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-error-800 mb-2">Warning: This action is irreversible!</p>
              <p className="text-sm text-error-700">
                This will permanently delete <strong>{businessToForceDelete.name}</strong> and ALL related data including:
              </p>
              <ul className="list-disc list-inside text-sm text-error-700 mt-2 space-y-1">
                <li>All users associated with this business</li>
                <li>All employees</li>
                <li>All orders and order items</li>
                <li>All invoices and invoice items</li>
                <li>All activity logs</li>
              </ul>
            </div>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. Are you absolutely sure you want to proceed?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                size="md"
                onClick={handleForceDeleteCancel}
                disabled={deletingBusiness === businessToForceDelete.id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleForceDeleteConfirm}
                disabled={deletingBusiness === businessToForceDelete.id}
              >
                {deletingBusiness === businessToForceDelete.id ? 'Deleting...' : 'Force Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
