'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusinessServices } from '../../hooks/useBusinessServices';
import { useAuth } from '../../contexts/auth-context';
import { ServiceDto, BusinessServiceDto, ActivateServiceDto, ServiceWithPacksDto, PackWithComponentsDto } from '@contracts/core';
import { apiClient } from '../../lib/api-client';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Package, Plus, Info } from 'lucide-react';

export default function ServicesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    businessServices,
    allServices,
    loading,
    error,
    loadBusinessServices,
    activateService,
    updateService,
    deactivateService,
    setError,
  } = useBusinessServices();
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = useState<Map<string, ServiceWithPacksDto>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [selectedPacks, setSelectedPacks] = useState<Map<string, Set<string>>>(new Map());
  const [activatingServiceId, setActivatingServiceId] = useState<string | null>(null);
  const [packDetails, setPackDetails] = useState<Map<string, PackWithComponentsDto>>(new Map());
  const [loadingPackDetails, setLoadingPackDetails] = useState<Set<string>>(new Set());
  const [expandedPackId, setExpandedPackId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.businessId) {
      loadBusinessServices();
    }
  }, [user, loadBusinessServices]);

  const loadServiceDetails = async (serviceId: string) => {
    if (serviceDetails.has(serviceId)) {
      return;
    }
    try {
      setLoadingDetails(serviceId);
      const details = await apiClient.getServiceById(serviceId);
      setServiceDetails((prev) => new Map(prev).set(serviceId, details));
      
      // Preload pack details for all packs in this service
      const packIds = details.packs.map((p) => p.packId);
      await Promise.all(
        packIds.map((packId) => {
          if (!packDetails.has(packId)) {
            return loadPackDetails(packId);
          }
        })
      );
    } catch (err: any) {
      setError(err.message || t('services.failedToLoadServiceDetails'));
    } finally {
      setLoadingDetails(null);
    }
  };

  const loadPackDetails = async (packId: string) => {
    if (packDetails.has(packId)) {
      return;
    }
    try {
      setLoadingPackDetails((prev) => new Set(prev).add(packId));
      const details = await apiClient.getPackById(packId);
      setPackDetails((prev) => new Map(prev).set(packId, details));
    } catch (err: any) {
      // Silently fail - pack details are optional
      console.error('Failed to load pack details:', err);
    } finally {
      setLoadingPackDetails((prev) => {
        const next = new Set(prev);
        next.delete(packId);
        return next;
      });
    }
  };

  const handleTogglePackDetails = (packId: string) => {
    if (expandedPackId === packId) {
      setExpandedPackId(null);
    } else {
      setExpandedPackId(packId);
      loadPackDetails(packId);
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

  const handleSelectPack = (serviceId: string, packId: string) => {
    setSelectedPacks((prev) => {
      const newMap = new Map(prev);
      // Only one pack can be selected per service
      newMap.set(serviceId, new Set([packId]));
      return newMap;
    });
  };

  const handleActivateService = async (serviceId: string) => {
    const packIds = Array.from(selectedPacks.get(serviceId) || []);
    if (packIds.length === 0) {
      setError(t('services.selectPack'));
      return;
    }

    try {
      setActivatingServiceId(serviceId);
      setError('');
      await activateService({ serviceId, packIds });
      setSelectedPacks((prev) => {
        const newMap = new Map(prev);
        newMap.delete(serviceId);
        return newMap;
      });
    } catch (err: any) {
      // Error is already set by the hook
    } finally {
      setActivatingServiceId(null);
    }
  };

  const handleUpdateServicePacks = async (serviceId: string, packIds: string[]) => {
    try {
      setError('');
      await updateService(serviceId, { packIds });
      setServiceDetails(new Map()); // Clear cache to reload
      await loadBusinessServices();
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const handleDeactivateService = async (serviceId: string) => {
    if (!confirm(t('services.confirmDeactivate'))) {
      return;
    }

    try {
      setError('');
      await deactivateService(serviceId);
    } catch (err: any) {
      // Error is already set by the hook
    }
  };

  const getActivatedService = (serviceId: string): BusinessServiceDto | undefined => {
    return businessServices.find((bs) => bs.serviceId === serviceId && bs.isActive);
  };

  const getAvailableServices = (): ServiceDto[] => {
    const activatedServiceIds = new Set(businessServices.map((bs) => bs.serviceId));
    // Backend already filters by isPublished and isActive for BUSINESS_ADMIN, so we just need to filter out already activated services
    return allServices.filter((s) => !activatedServiceIds.has(s.id));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('services.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('services.subtitleReadonly')}
        </p>
      </div>

      {error && <Error message={error} onRetry={() => setError('')} />}

      {/* Activated Services */}
      {businessServices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('services.activatedServices')}</h2>
          <div className="space-y-4">
            {businessServices.map((businessService) => {
              const service = allServices.find((s) => s.id === businessService.serviceId);
              if (!service) return null;

              const details = serviceDetails.get(service.id);
              const isExpanded = expandedServiceId === service.id;

              return (
                <div key={businessService.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                      {(service.orderStartTime || service.cutoffTime) && (
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {service.orderStartTime && (
                            <span>{t('services.orderStarts')}: {service.orderStartTime}</span>
                          )}
                          {service.cutoffTime && (
                            <span>{t('services.cutoffTime')}: {service.cutoffTime}</span>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {businessService.packs.filter((p) => p.isActive).length === 1
                          ? t('services.packsActivated', { count: 1 })
                          : t('services.packsActivated_plural', { count: businessService.packs.filter((p) => p.isActive).length })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleExpand(service.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      {loadingDetails === service.id ? (
                        <div className="text-center py-4">{t('services.loading')}</div>
                      ) : details ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">{t('services.activatedPacks')}</h4>
                            {businessService.packs.filter((p) => p.isActive).length === 0 ? (
                              <p className="text-sm text-gray-500">{t('services.noPacksActivated')}</p>
                            ) : (
                              <div className="space-y-3">
                                {businessService.packs.filter((pack) => pack.isActive).map((pack) => {
                                  const packDetail = packDetails.get(pack.packId);
                                  const isPackExpanded = expandedPackId === pack.packId;
                                  const isLoadingPack = loadingPackDetails.has(pack.packId);
                                  
                                  return (
                                    <div
                                      key={pack.id}
                                      className="bg-green-50 rounded-lg border border-green-200 overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between p-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{pack.packName}</span>
                                            <span className="text-sm font-medium text-gray-700">
                                              {pack.packPrice.toFixed(2)} TND
                                            </span>
                                          </div>
                                          {pack.nextPackId && pack.effectiveDate && (
                                            <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                              <span className="text-blue-700 font-medium">
                                                {t('services.packChangeScheduled')}: {pack.nextPackName} {t('services.effectiveFrom')} {pack.effectiveDate}
                                              </span>
                                            </div>
                                          )}
                                          {packDetail && packDetail.components.length > 0 && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              {packDetail.components.length} {packDetail.components.length === 1 ? t('services.component') : t('services.components')}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {packDetail && packDetail.components.length > 0 && (
                                            <button
                                              onClick={() => handleTogglePackDetails(pack.packId)}
                                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-green-100 rounded transition-colors"
                                              title={t('services.viewPackDetails')}
                                            >
                                              {isPackExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                              ) : (
                                                <ChevronDown className="h-4 w-4" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {isPackExpanded && (
                                        <div className="px-3 pb-3 border-t border-green-200 pt-3">
                                          {isLoadingPack ? (
                                            <div className="text-center py-2 text-sm text-gray-500">
                                              {t('services.loading')}
                                            </div>
                                          ) : packDetail && packDetail.components.length > 0 ? (
                                            <div className="space-y-2">
                                              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                                {t('services.packIncludes')}
                                              </h5>
                                              <div className="space-y-1.5">
                                                {packDetail.components
                                                  .sort((a, b) => a.orderIndex - b.orderIndex)
                                                  .map((component) => (
                                                    <div
                                                      key={component.id}
                                                      className="flex items-center gap-2 text-sm"
                                                    >
                                                      <div className={`w-1.5 h-1.5 rounded-full ${component.required ? 'bg-green-600' : 'bg-gray-400'}`} />
                                                      <span className="text-gray-700">{component.componentName}</span>
                                                      {component.required && (
                                                        <span className="text-xs text-gray-500">({t('services.required')})</span>
                                                      )}
                                                    </div>
                                                  ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-sm text-gray-500">{t('services.noComponentsAvailable')}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {details.packs.length > businessService.packs.filter((p) => p.isActive).length && (
                            <div>
                              <h4 className="font-medium mb-2">{t('services.changePack')}</h4>
                              <div className="space-y-2">
                                {details.packs
                                  .filter(
                                    (sp) => !businessService.packs.filter((p) => p.isActive).some((bp) => bp.packId === sp.packId),
                                  )
                                  .map((servicePack) => (
                                    <div
                                      key={servicePack.id}
                                      className="bg-gray-50 rounded-lg border-2 border-transparent hover:border-primary-300 transition-colors overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between p-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{servicePack.packName}</span>
                                            <span className="text-sm font-medium text-gray-700">
                                              {servicePack.packPrice.toFixed(2)} TND
                                            </span>
                                          </div>
                                          {(() => {
                                            const packDetail = packDetails.get(servicePack.packId);
                                            return packDetail && packDetail.components.length > 0 ? (
                                              <p className="text-xs text-gray-600 mt-1">
                                                {packDetail.components.length} {packDetail.components.length === 1 ? t('services.component') : t('services.components')}
                                              </p>
                                            ) : null;
                                          })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {(() => {
                                            const packDetail = packDetails.get(servicePack.packId);
                                            const isPackExpanded = expandedPackId === servicePack.packId;
                                            const isLoadingPack = loadingPackDetails.has(servicePack.packId);
                                            
                                            return packDetail && packDetail.components.length > 0 ? (
                                              <button
                                                onClick={() => handleTogglePackDetails(servicePack.packId)}
                                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                                title={t('services.viewPackDetails')}
                                              >
                                                {isPackExpanded ? (
                                                  <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                  <ChevronDown className="h-4 w-4" />
                                                )}
                                              </button>
                                            ) : null;
                                          })()}
                                          <button
                                            onClick={() =>
                                              handleUpdateServicePacks(service.id, [servicePack.packId])
                                            }
                                            className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                          >
                                            {t('services.switchToThisPack')}
                                          </button>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {t('services.packChangeEffectiveNextDay')}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {expandedPackId === servicePack.packId && (() => {
                                        const packDetail = packDetails.get(servicePack.packId);
                                        const isLoadingPack = loadingPackDetails.has(servicePack.packId);
                                        
                                        return (
                                          <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                                            {isLoadingPack ? (
                                              <div className="text-center py-2 text-sm text-gray-500">
                                                {t('services.loading')}
                                              </div>
                                            ) : packDetail && packDetail.components.length > 0 ? (
                                              <div className="space-y-2">
                                                <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                                  {t('services.packIncludes')}
                                                </h5>
                                                <div className="space-y-1.5">
                                                  {packDetail.components
                                                    .sort((a, b) => a.orderIndex - b.orderIndex)
                                                    .map((component) => (
                                                      <div
                                                        key={component.id}
                                                        className="flex items-center gap-2 text-sm"
                                                      >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${component.required ? 'bg-primary-600' : 'bg-gray-400'}`} />
                                                        <span className="text-gray-700">{component.componentName}</span>
                                                        {component.required && (
                                                          <span className="text-xs text-gray-500">({t('services.required')})</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-500">{t('services.noComponentsAvailable')}</p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">{t('services.clickToLoadDetails')}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {businessServices.length === 0 && (
        <Empty message={t('services.noServicesActivated')} />
      )}
    </div>
  );
}
