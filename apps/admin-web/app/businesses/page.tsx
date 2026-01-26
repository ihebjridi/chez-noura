'use client';

import { useState, useEffect } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import { CreateBusinessDto, ActivityLogDto } from '@contracts/core';
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
import { apiClient } from '../../lib/api-client';
import { formatDateTime } from '../../lib/date-utils';
import { Trash2, ChevronDown, ChevronRight, Activity } from 'lucide-react';

export default function BusinessesPage() {
  const { businesses, loading, error, loadBusinesses, createBusiness, deleteBusiness, setError } = useBusinesses();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateBusinessDto>({
    name: '',
    adminEmail: '',
  });
  const [generatingPassword, setGeneratingPassword] = useState<string | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<string | null>(null);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string; name: string } | null>(null);
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
      const result = await createBusiness(formData);
      setShowCreateForm(false);
      setFormData({ name: '', adminEmail: '' });
      // Show success message with credentials
      setError(`Business created! Admin: ${result.adminCredentials.email}, Password: ${result.adminCredentials.temporaryPassword} - Save these credentials securely.`);
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleGeneratePassword = async (businessId: string) => {
    try {
      setGeneratingPassword(businessId);
      setError('');
      const result = await apiClient.generateBusinessAdminPassword(businessId);
      setError(`New password generated! Admin: ${result.email}, Password: ${result.temporaryPassword} - Save these credentials securely.`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate new password');
    } finally {
      setGeneratingPassword(null);
    }
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
      setBusinessToDelete(null);
      setError(`Business "${businessToDelete.name}" deleted successfully.`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete business');
    } finally {
      setDeletingBusiness(null);
    }
  };

  const handleDeleteCancel = () => {
    setBusinessToDelete(null);
  };

  const toggleActivityLogs = async (businessId: string) => {
    const isExpanded = expandedActivityLogs.has(businessId);
    if (isExpanded) {
      // Collapse
      setExpandedActivityLogs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    } else {
      // Expand and load logs if not already loaded
      setExpandedActivityLogs((prev) => {
        const newSet = new Set(prev);
        newSet.add(businessId);
        return newSet;
      });
      
      // Only load if we don't have logs for this business
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-surface border border-surface-dark rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{business.name}</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={business.status} />
                  <button
                    onClick={() => handleDeleteClick(business)}
                    disabled={generatingPassword === business.id || deletingBusiness === business.id}
                    className="p-1.5 text-error-600 hover:text-error-700 hover:bg-error-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete business"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {business.email}
                </p>
                {business.phone && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {business.phone}
                  </p>
                )}
                {business.address && (
                  <p className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="flex-1">{business.address}</span>
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-surface-dark space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleGeneratePassword(business.id)}
                  disabled={generatingPassword === business.id || deletingBusiness === business.id}
                  className="w-full"
                >
                  {generatingPassword === business.id ? 'Generating...' : 'Generate New Password'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActivityLogs(business.id)}
                  disabled={deletingBusiness === business.id}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {expandedActivityLogs.has(business.id) ? (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Hide Activity Logs
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      View Activity Logs
                    </>
                  )}
                </Button>
              </div>

              {/* Activity Logs Section */}
              {expandedActivityLogs.has(business.id) && (
                <div className="mt-4 pt-4 border-t border-surface-dark">
                  {loadingLogsByBusiness.has(business.id) ? (
                    <div className="py-8">
                      <Loading message="Loading activity logs..." />
                    </div>
                  ) : errorLogsByBusiness.has(business.id) ? (
                    <div className="py-4">
                      <Error message={errorLogsByBusiness.get(business.id) || 'Failed to load activity logs'} />
                    </div>
                  ) : (() => {
                    const businessLogs = activityLogsByBusiness.get(business.id) || [];
                    return businessLogs.length === 0 ? (
                      <div className="py-8">
                        <Empty
                          message="No activity logs found"
                          description="Activity logs will appear here when actions are performed."
                        />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-gray-600" />
                          <h4 className="text-sm font-semibold text-gray-900">Activity Logs</h4>
                          <span className="text-xs text-gray-500">({businessLogs.length})</span>
                        </div>
                        <table className="w-full">
                          <thead className="bg-surface-light">
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
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {businessToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Business</h3>
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
                variant="ghost"
                size="md"
                onClick={handleDeleteConfirm}
                disabled={deletingBusiness === businessToDelete.id}
              >
                {deletingBusiness === businessToDelete.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
