'use client';

import { useState, useEffect } from 'react';
import { ServiceDto, ServiceWithPacksDto, ActivateServiceDto } from '@contracts/core';
import { apiClient } from '../../lib/api-client';
import { Button } from '../ui/button';
import { Error } from '../ui/error';
import { X } from 'lucide-react';

interface AssignServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  onServiceAssigned?: () => void;
}

export function AssignServiceModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  onServiceAssigned,
}: AssignServiceModalProps) {
  const [allServices, setAllServices] = useState<ServiceDto[]>([]);
  const [businessServices, setBusinessServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [servicePacks, setServicePacks] = useState<Map<string, ServiceWithPacksDto>>(new Map());
  const [loadingPacks, setLoadingPacks] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Reset form when modal closes
      setSelectedServiceId('');
      setSelectedPackId('');
      setError('');
    }
  }, [isOpen, businessId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [services, businessServicesData] = await Promise.all([
        apiClient.getServices(),
        apiClient.getBusinessServices(businessId),
      ]);
      setAllServices(services.filter((s) => s.isPublished && s.isActive));
      setBusinessServices(businessServicesData.filter((bs) => bs.isActive).map((bs) => bs.serviceId));
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedPackId) {
      setError('Please select both a service and a pack');
      return;
    }

    try {
      setAssigning(true);
      setError('');
      const data: ActivateServiceDto = {
        serviceId: selectedServiceId,
        packIds: [selectedPackId],
      };
      await apiClient.activateBusinessService(businessId, data);
      onServiceAssigned?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign service');
    } finally {
      setAssigning(false);
    }
  };

  const getAvailableServices = (): ServiceDto[] => {
    return allServices.filter((s) => !businessServices.includes(s.id));
  };

  const selectedService = selectedServiceId ? servicePacks.get(selectedServiceId) : null;
  const isLoadingPacks = selectedServiceId ? loadingPacks.has(selectedServiceId) : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Service to Business</h2>
            <p className="text-sm text-gray-600 mt-1">{businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Error message={error} onRetry={() => setError('')} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading services...</div>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    {service.description && ` - ${service.description}`}
                  </option>
                ))}
              </select>
              {selectedService && (
                <div className="mt-2 text-sm text-gray-500">
                  Order start: {selectedService.orderStartTime || '—'} · Cutoff: {selectedService.cutoffTime || '—'}
                </div>
              )}
              {getAvailableServices().length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  All available services are already assigned to this business.
                </p>
              )}
            </div>

            {selectedServiceId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pack <span className="text-red-500">*</span>
                </label>
                {isLoadingPacks ? (
                  <div className="text-sm text-gray-500 py-2">Loading packs...</div>
                ) : selectedService && selectedService.packs && selectedService.packs.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {selectedService.packs.map((pack) => (
                      <label
                        key={pack.packId}
                        className="flex items-center gap-3 p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
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
                  <div className="text-sm text-gray-500 py-2">No packs available for this service</div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={assigning || !selectedServiceId || !selectedPackId || getAvailableServices().length === 0}
              >
                {assigning ? 'Assigning...' : 'Assign Service'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
