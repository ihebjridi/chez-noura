'use client';

import { useState, useEffect } from 'react';
import { useServices } from '../../hooks/useServices';
import { usePacks } from '../../hooks/usePacks';
import { ServiceDto, CreateServiceDto, UpdateServiceDto, ServiceWithPacksDto, PackDto } from '@contracts/core';
import { Error } from '../../components/ui/error';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { apiClient } from '../../lib/api-client';
import { ChevronDown, ChevronUp, X, Plus, Edit2, Settings, Package, CheckCircle2, XCircle, Trash2, Globe, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '../../components/ui/dialog';

export default function ServicesPage() {
  const { services, loading, error, loadServices, createService, updateService, deleteService, setError } = useServices();
  const { packs, loadPacks } = usePacks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDto | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<Map<string, ServiceWithPacksDto>>(new Map());
  const [formData, setFormData] = useState<CreateServiceDto>({
    name: '',
    description: '',
    isActive: true,
    isPublished: false,
    orderStartTime: '',
    cutoffTime: '',
  });
  const [creatingService, setCreatingService] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
    loadPacks();
  }, [loadServices, loadPacks]);

  const loadServiceDetails = async (serviceId: string) => {
    if (serviceDetails.has(serviceId)) {
      return;
    }
    try {
      setLoadingDetails(serviceId);
      const details = await apiClient.getServiceById(serviceId);
      setServiceDetails((prev) => new Map(prev).set(serviceId, details));
    } catch (err: any) {
      setError(err.message || 'Failed to load service details');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleToggleExpand = (serviceId: string) => {
    if (expandedServiceId === serviceId) {
      setExpandedServiceId(null);
    } else {
      setExpandedServiceId(serviceId);
      loadServiceDetails(serviceId);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      setCreatingService(true);
      setError('');
      await createService(formData);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', isActive: true, isPublished: false, orderStartTime: '', cutoffTime: '' });
    } catch (err: any) {
      // Error is already set by the hook
    } finally {
      setCreatingService(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!formData.name.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      setError('');
      const updateData: UpdateServiceDto = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        isPublished: formData.isPublished,
        orderStartTime: formData.orderStartTime || undefined,
        cutoffTime: formData.cutoffTime || undefined,
      };
      await updateService(editingService.id, updateData);
      setEditingService(null);
      setFormData({ name: '', description: '', isActive: true, isPublished: false, orderStartTime: '', cutoffTime: '' });
      setServiceDetails(new Map()); // Clear cache to reload
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const startEdit = (service: ServiceDto) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      isActive: service.isActive,
      isPublished: service.isPublished,
      orderStartTime: service.orderStartTime || '',
      cutoffTime: service.cutoffTime || '',
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', isActive: true, isPublished: false });
  };

  const handleDeleteClick = (serviceId: string) => {
    setDeletingServiceId(serviceId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingServiceId) return;

    try {
      setError('');
      await deleteService(deletingServiceId);
      setShowDeleteModal(false);
      setDeletingServiceId(null);
      setServiceDetails(new Map()); // Clear cache
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingServiceId(null);
  };

  const handleAddPack = async (serviceId: string, packId: string) => {
    try {
      setError('');
      await apiClient.addPackToService(serviceId, packId);
      setServiceDetails(new Map()); // Clear cache to reload
      await loadServiceDetails(serviceId);
    } catch (err: any) {
      setError(err.message || 'Failed to add pack to service');
    }
  };

  const handleRemovePack = async (serviceId: string, packId: string) => {
    try {
      setError('');
      await apiClient.removePackFromService(serviceId, packId);
      setServiceDetails(new Map()); // Clear cache to reload
      await loadServiceDetails(serviceId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove pack from service');
    }
  };

  const getAvailablePacks = (serviceId: string): PackDto[] => {
    const details = serviceDetails.get(serviceId);
    if (!details) return packs;
    const assignedPackIds = new Set(details.packs.map((p) => p.packId));
    return packs.filter((pack) => !assignedPackIds.has(pack.id) && pack.isActive);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Services"
        description="Manage services and assign packs to them"
        action={
          !showCreateForm && !editingService ? (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Service
            </Button>
          ) : null
        }
      />

      {error && <Error message={error} onRetry={() => setError('')} />}

      {(showCreateForm || editingService) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h2>
            </div>
          </div>
          <form onSubmit={editingService ? handleUpdate : handleCreate} className="p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <FormField label="Name" required>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Dejeuner, Petit Dejeuner, Diner"
                    required
                  />
                </FormField>

                <FormField label="Description">
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the service"
                  />
                </FormField>

                <FormField label="Status">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </FormField>

                <FormField label="Published">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.isPublished ? 'Published (visible to businesses)' : 'Unpublished (hidden from businesses)'}
                    </span>
                  </div>
                </FormField>

                <FormField label="Order Start Time">
                  <Input
                    type="time"
                    value={formData.orderStartTime || ''}
                    onChange={(e) => setFormData({ ...formData, orderStartTime: e.target.value })}
                    placeholder="HH:MM (24-hour format)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Time when orders start being accepted each day (e.g., 08:00)
                  </p>
                </FormField>

                <FormField label="Cutoff Time">
                  <Input
                    type="time"
                    value={formData.cutoffTime || ''}
                    onChange={(e) => setFormData({ ...formData, cutoffTime: e.target.value })}
                    placeholder="HH:MM (24-hour format)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Time when orders stop being accepted each day (e.g., 14:00)
                  </p>
                </FormField>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" disabled={creatingService}>
                  {editingService ? 'Update' : 'Create'} Service
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={editingService ? cancelEdit : () => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {services.length === 0 && !loading ? (
        <Empty message="No services found. Create your first service to get started." />
      ) : (
        <div className="grid gap-4">
          {services.map((service) => {
            const details = serviceDetails.get(service.id);
            const isExpanded = expandedServiceId === service.id;
            const availablePacks = getAvailablePacks(service.id);

            return (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Service Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${service.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Settings className={`h-5 w-5 ${service.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                            {service.isActive ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            {service.isPublished ? (
                              <div title="Published - visible to businesses">
                                <Globe className="h-4 w-4 text-blue-500" />
                              </div>
                            ) : (
                              <div title="Unpublished - hidden from businesses">
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            {!service.isActive && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                Inactive
                              </span>
                            )}
                            {!service.isPublished && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                Unpublished
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                          {(service.orderStartTime || service.cutoffTime) && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              {service.orderStartTime && (
                                <span>Starts: {service.orderStartTime}</span>
                              )}
                              {service.cutoffTime && (
                                <span>Cutoff: {service.cutoffTime}</span>
                              )}
                            </div>
                          )}
                          {details && (
                            <div className="flex items-center gap-2 mt-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {details.packs.length} pack{details.packs.length !== 1 ? 's' : ''} assigned
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleExpand(service.id)}
                        className="flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Hide</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            <span className="hidden sm:inline">View Packs</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(service)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteClick(service.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-5">
                      {loadingDetails === service.id ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading pack details...</p>
                        </div>
                      ) : details ? (
                        <div className="space-y-6">
                          {/* Assigned Packs Section */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Package className="h-4 w-4 text-gray-400" />
                              <h4 className="font-semibold text-gray-900">Assigned Packs</h4>
                              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                                {details.packs.length}
                              </span>
                            </div>
                            {details.packs.length === 0 ? (
                              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No packs assigned to this service</p>
                                <p className="text-xs text-gray-400 mt-1">Add packs from the available list below</p>
                              </div>
                            ) : (
                              <div className="grid gap-2">
                                {details.packs.map((servicePack) => (
                                  <div
                                    key={servicePack.id}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="p-1.5 bg-primary-50 rounded">
                                        <Package className="h-4 w-4 text-primary-600" />
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-900">{servicePack.packName}</span>
                                        <span className="text-sm text-gray-600 ml-2">
                                          {servicePack.packPrice.toFixed(2)} TND
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleRemovePack(service.id, servicePack.packId)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Available Packs Section */}
                          {availablePacks.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Plus className="h-4 w-4 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">Available Packs</h4>
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  {availablePacks.length}
                                </span>
                              </div>
                              <div className="grid gap-2">
                                {availablePacks.map((pack) => (
                                  <div
                                    key={pack.id}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="p-1.5 bg-gray-50 rounded">
                                        <Package className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-900">{pack.name}</span>
                                        <span className="text-sm text-gray-600 ml-2">
                                          {pack.price.toFixed(2)} TND
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleAddPack(service.id, pack.id)}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Click to load pack details</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Service?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deletingServiceId && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Service <strong>"{services.find(s => s.id === deletingServiceId)?.name}"</strong> will be permanently deleted.
                </p>
                <p className="text-sm text-gray-600">
                  This will also delete all associated service packs and business services. If this service has active business services, deletion will be prevented to maintain data integrity.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleDeleteCancel}
              disabled={!deletingServiceId}
            >
              Cancel
            </Button>
            <button
              onClick={handleDeleteConfirm}
              disabled={!deletingServiceId}
              className="px-4 py-2 bg-destructive text-white rounded hover:bg-destructive-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
