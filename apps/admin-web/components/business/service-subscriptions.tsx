'use client';

import { useState, useEffect } from 'react';
import { BusinessServiceDto, ServiceDto, ServiceWithPacksDto, ActivateServiceDto } from '@contracts/core';
import { apiClient } from '../../lib/api-client';
import { Loading } from '../ui/loading';
import { Error } from '../ui/error';
import { Empty } from '../ui/empty';
import { Button } from '../ui/button';
import { Package, Plus, X, CheckCircle2, Clock } from 'lucide-react';

interface ServiceSubscriptionsProps {
  businessId: string;
  onServiceActivated?: () => void;
  onServiceDeactivated?: () => void;
  refreshTrigger?: number; // Optional trigger to force refresh
}

export function ServiceSubscriptions({
  businessId,
  onServiceActivated,
  onServiceDeactivated,
  refreshTrigger,
}: ServiceSubscriptionsProps) {
  const [businessServices, setBusinessServices] = useState<BusinessServiceDto[]>([]);
  const [allServices, setAllServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActivateForm, setShowActivateForm] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [servicePacks, setServicePacks] = useState<Map<string, ServiceWithPacksDto>>(new Map());
  const [loadingPacks, setLoadingPacks] = useState<Set<string>>(new Set());
  const [activating, setActivating] = useState(false);
  const [deactivatingServiceId, setDeactivatingServiceId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [businessId, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [services, allServicesData] = await Promise.all([
        apiClient.getBusinessServices(businessId),
        apiClient.getServices(),
      ]);
      setBusinessServices(services.filter((bs) => bs.isActive));
      setAllServices(allServicesData.filter((s) => s.isPublished && s.isActive));
    } catch (err: any) {
      setError(err.message || 'Failed to load service subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadServicePacks = async (serviceId: string) => {
    if (servicePacks.has(serviceId)) return;

    try {
      setLoadingPacks((prev) => new Set(prev).add(serviceId));
      const service = await apiClient.getServiceById(serviceId);
      setServicePacks((prev) => {
        const newMap = new Map(prev);
        newMap.set(serviceId, service);
        return newMap;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load service packs');
    } finally {
      setLoadingPacks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedPackId('');
    if (serviceId) {
      loadServicePacks(serviceId);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedPackId) {
      setError('Please select both a service and a pack');
      return;
    }

    try {
      setActivating(true);
      setError('');
      const data: ActivateServiceDto = {
        serviceId: selectedServiceId,
        packIds: [selectedPackId],
      };
      await apiClient.activateBusinessService(businessId, data);
      setShowActivateForm(false);
      setSelectedServiceId('');
      setSelectedPackId('');
      await loadData();
      onServiceActivated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to activate service');
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async (serviceId: string) => {
    if (!confirm('Are you sure you want to deactivate this service for this business?')) {
      return;
    }

    try {
      setDeactivatingServiceId(serviceId);
      setError('');
      await apiClient.deactivateBusinessService(businessId, serviceId);
      await loadData();
      onServiceDeactivated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate service');
    } finally {
      setDeactivatingServiceId(null);
    }
  };

  const getAvailableServices = (): ServiceDto[] => {
    const activatedServiceIds = new Set(businessServices.map((bs) => bs.serviceId));
    return allServices.filter((s) => !activatedServiceIds.has(s.id));
  };

  const selectedService = selectedServiceId ? servicePacks.get(selectedServiceId) : null;
  const isLoadingPacks = selectedServiceId ? loadingPacks.has(selectedServiceId) : false;

  if (loading) {
    return <Loading message="Loading service subscriptions..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-900">Service Subscriptions</h4>
        </div>
        {!showActivateForm && getAvailableServices().length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowActivateForm(true)}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Activate Service
          </Button>
        )}
      </div>

      {error && <Error message={error} onRetry={() => setError('')} />}

      {showActivateForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                required
              >
                <option value="">Select a service</option>
                {getAvailableServices().map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedServiceId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack <span className="text-red-500">*</span>
                </label>
                {isLoadingPacks ? (
                  <div className="text-sm text-gray-500">Loading packs...</div>
                ) : selectedService && selectedService.packs && selectedService.packs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedService.packs.map((pack) => (
                      <label
                        key={pack.packId}
                        className="flex items-center gap-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="pack"
                          value={pack.packId}
                          checked={selectedPackId === pack.packId}
                          onChange={(e) => setSelectedPackId(e.target.value)}
                          className="text-primary-600 focus:ring-primary-500"
                          required
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{pack.packName}</div>
                          <div className="text-xs text-gray-500">{pack.packPrice.toFixed(2)} TND</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No packs available for this service</div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={activating || !selectedServiceId || !selectedPackId}
              >
                {activating ? 'Activating...' : 'Activate Service'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowActivateForm(false);
                  setSelectedServiceId('');
                  setSelectedPackId('');
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {businessServices.length === 0 ? (
        <Empty
          message="No active services"
          description="Activate a service to make it available to this business's employees."
        />
      ) : (
        <div className="space-y-2">
          {businessServices.map((businessService) => {
            const activePack = businessService.packs.find((p) => p.isActive);
            const pendingPack = businessService.packs.find(
              (p) => p.nextPackId && p.effectiveDate,
            );

            return (
              <div
                key={businessService.id}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {businessService.serviceName}
                      </span>
                    </div>
                    {businessService.serviceDescription && (
                      <p className="text-xs text-gray-600 mb-2">
                        {businessService.serviceDescription}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mb-2">
                      Order start: {businessService.orderStartTime || '—'} · Cutoff: {businessService.cutoffTime || '—'}
                    </div>
                    {activePack && (
                      <div className="text-xs text-gray-600">
                        <strong>Active Pack:</strong> {activePack.packName} (
                        {activePack.packPrice.toFixed(2)} TND)
                      </div>
                    )}
                    {pendingPack && pendingPack.nextPackName && pendingPack.effectiveDate && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                        <Clock className="w-3 h-3" />
                        <span>
                          Pack change scheduled: {pendingPack.nextPackName} (effective{' '}
                          {pendingPack.effectiveDate})
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeactivate(businessService.serviceId)}
                    disabled={deactivatingServiceId === businessService.serviceId}
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    {deactivatingServiceId === businessService.serviceId ? 'Deactivating...' : 'Deactivate'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
