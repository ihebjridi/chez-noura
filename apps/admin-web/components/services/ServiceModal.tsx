'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import {
  ServiceDto,
  ServiceWithPacksDto,
  CreateServiceDto,
  UpdateServiceDto,
  PackDto,
  ServicePackDto,
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
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Plus, Package, X, Settings } from 'lucide-react';

export interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  serviceId: string | null;
  onSaved?: () => void;
}

export function ServiceModal({
  open,
  onClose,
  serviceId,
  onSaved,
}: ServiceModalProps) {
  const isCreate = serviceId === null;

  const [service, setService] = useState<ServiceDto | null>(null);
  const [servicePacks, setServicePacks] = useState<ServicePackDto[]>([]);
  const [packs, setPacks] = useState<PackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateServiceDto>({
    name: '',
    description: '',
    isActive: true,
    isPublished: false,
    orderStartTime: '',
    cutoffTime: '',
  });
  const [saving, setSaving] = useState(false);
  const [showAddPack, setShowAddPack] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingPackId, setRemovingPackId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (isCreate) {
      setService(null);
      setServicePacks([]);
      setFormData({
        name: '',
        description: '',
        isActive: true,
        isPublished: false,
        orderStartTime: '',
        cutoffTime: '',
      });
    }
  }, [open, serviceId, isCreate]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const allPacks = await apiClient.getPacks();
        if (cancelled) return;
        setPacks(allPacks);

        if (isCreate) {
          setLoading(false);
          return;
        }

        if (serviceId) {
          const serviceWithPacks = await apiClient.getServiceById(serviceId);
          if (cancelled) return;
          const serviceDetails = serviceWithPacks as ServiceWithPacksDto;
          setService(serviceDetails);
          setFormData({
            name: serviceDetails.name,
            description: serviceDetails.description || '',
            isActive: serviceDetails.isActive,
            isPublished: serviceDetails.isPublished,
            orderStartTime: serviceDetails.orderStartTime || '',
            cutoffTime: serviceDetails.cutoffTime || '',
          });
          setServicePacks(serviceDetails.packs || []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, serviceId, isCreate]);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Service name is required');
      return;
    }

    if (isCreate) {
      try {
        setSaving(true);
        const updateData: CreateServiceDto = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          isActive: formData.isActive,
          isPublished: formData.isPublished,
          orderStartTime: formData.orderStartTime || undefined,
          cutoffTime: formData.cutoffTime || undefined,
        };
        await apiClient.createService(updateData);
        onSaved?.();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create service');
      } finally {
        setSaving(false);
      }
    } else if (serviceId) {
      try {
        setSaving(true);
        const updateData: UpdateServiceDto = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          isActive: formData.isActive,
          isPublished: formData.isPublished,
          orderStartTime: formData.orderStartTime || undefined,
          cutoffTime: formData.cutoffTime || undefined,
        };
        await apiClient.updateService(serviceId, updateData);
        setService((prev) =>
          prev ? { ...prev, ...updateData } : null,
        );
        onSaved?.();
      } catch (err: any) {
        setError(err.message || 'Failed to update service');
      } finally {
        setSaving(false);
      }
    }
  };

  const availablePacks = packs.filter(
    (p) => !servicePacks.some((sp) => sp.packId === p.id) && p.isActive,
  );

  const openAddPack = () => {
    setSelectedPackId(availablePacks[0]?.id ?? '');
    setShowAddPack(true);
  };

  const handleAddPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !selectedPackId) return;
    try {
      setAdding(true);
      setError('');
      await apiClient.addPackToService(serviceId, selectedPackId);
      setShowAddPack(false);
      const serviceWithPacks = await apiClient.getServiceById(serviceId);
      setServicePacks((serviceWithPacks as ServiceWithPacksDto).packs || []);
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add pack to service');
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePack = async (packId: string) => {
    if (!serviceId) return;
    try {
      setRemovingPackId(packId);
      setError('');
      await apiClient.removePackFromService(serviceId, packId);
      const serviceWithPacks = await apiClient.getServiceById(serviceId);
      setServicePacks((serviceWithPacks as ServiceWithPacksDto).packs || []);
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to remove pack from service');
    } finally {
      setRemovingPackId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-surface border border-surface-dark rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'New Service' : service ? service.name : 'Service'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Create a service with name, description, and timing settings.'
              : 'View or edit this service and its assigned packs.'}
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
          <div className="space-y-6 py-4">
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Service Details
              </h3>
              <form onSubmit={handleSaveService} className="space-y-4">
                <FormField label="Name" required>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    placeholder="e.g., Dejeuner, Petit Dejeuner, Diner"
                  />
                </FormField>

                <FormField label="Description">
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the service"
                  />
                </FormField>

                <FormField label="">
                  <Checkbox
                    label="Active"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                </FormField>

                <FormField label="">
                  <Checkbox
                    label="Published (visible to businesses)"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPublished: e.target.checked,
                      }))
                    }
                  />
                </FormField>

                <FormField label="Order Start Time">
                  <Input
                    type="time"
                    value={formData.orderStartTime || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        orderStartTime: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cutoffTime: e.target.value,
                      }))
                    }
                    placeholder="HH:MM (24-hour format)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Time when orders stop being accepted each day (e.g., 14:00)
                  </p>
                </FormField>

                {!isCreate && (
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </form>

              {isCreate && (
                <DialogFooter className="border-t border-surface-dark pt-4 mt-4">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={saving}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveService(e);
                    }}
                  >
                    {saving ? 'Creating...' : 'Create Service'}
                  </Button>
                </DialogFooter>
              )}
            </section>

            {!isCreate && serviceId && (
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Assigned Packs
                </h3>
                {availablePacks.length > 0 && (
                  <div className="mb-3">
                    {!showAddPack ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={openAddPack}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Pack
                      </Button>
                    ) : (
                      <form
                        onSubmit={handleAddPack}
                        className="p-4 bg-surface-light border border-surface-dark rounded-lg space-y-3 flex flex-wrap items-end gap-3"
                      >
                        <FormField label="Pack" className="min-w-[200px]">
                          <select
                            value={selectedPackId}
                            onChange={(e) => setSelectedPackId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-surface-dark rounded-md bg-surface text-gray-900"
                          >
                            <option value="">Select pack</option>
                            {availablePacks.map((pack) => (
                              <option key={pack.id} value={pack.id}>
                                {pack.name} ({pack.price.toFixed(2)} TND)
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={adding}
                          >
                            {adding ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowAddPack(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {servicePacks.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    No packs assigned to this service. Add a pack above.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pack Name</TableHead>
                        <TableHead>Price (TND)</TableHead>
                        <TableHead className="w-24 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicePacks.map((sp) => (
                        <TableRow key={sp.id}>
                          <TableCell className="font-medium">
                            {sp.packName}
                          </TableCell>
                          <TableCell>
                            {sp.packPrice.toFixed(2)} TND
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemovePack(sp.packId)}
                              disabled={removingPackId === sp.packId}
                            >
                              {removingPackId === sp.packId ? (
                                '...'
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
