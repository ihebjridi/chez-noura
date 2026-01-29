'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusinessServices } from '../../hooks/useBusinessServices';
import { useAuth } from '../../contexts/auth-context';
import {
  ServiceDto,
  BusinessServiceDto,
  ServiceWithPacksDto,
  PackWithComponentsDto,
} from '@contracts/core';
import type { VariantDto } from '@contracts/core';
import { apiClient } from '../../lib/api-client';
import { Loading } from '../../components/ui/loading';
import { Error } from '../../components/ui/error';
import { Empty } from '../../components/ui/empty';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { CheckCircle2, Package, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// --- Types ---

type PackComponent = PackWithComponentsDto['components'][number];

// --- Service card header (static, no collapse) ---

function ServiceCardHeader({
  service,
  businessService,
}: {
  service: ServiceDto;
  businessService: BusinessServiceDto;
}) {
  const { t } = useTranslation();
  const activePacksCount = businessService.packs.filter((p) => p.isActive).length;

  return (
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {service.name}
            </CardTitle>
            {service.description && (
              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
            )}
          </div>
        </div>
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
      </div>

      {(service.orderStartTime || service.cutoffTime) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
          {service.orderStartTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('services.orderStarts')}: {service.orderStartTime}
            </span>
          )}
          {service.cutoffTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('services.cutoffTime')}: {service.cutoffTime}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {activePacksCount === 1
            ? t('services.packsActivated', { count: 1 })
            : t('services.packsActivated_plural', { count: activePacksCount })}
        </p>
      </div>
    </CardHeader>
  );
}

// --- Collapsible pack block (name, price, components list, variants per component) ---

function PackBlock({
  packId,
  packName,
  packPrice,
  nextPackName,
  effectiveDate,
  components,
  isExpanded,
  onToggle,
  variantsByComponentId,
  variantsLoading,
  action,
  appearance = 'active',
  hasScheduledChange,
  onCancelScheduledChange,
  t,
}: {
  packId: string;
  packName: string;
  packPrice: number;
  nextPackName?: string;
  effectiveDate?: string;
  components: PackComponent[];
  isExpanded: boolean;
  onToggle: () => void;
  variantsByComponentId: Map<string, VariantDto[]>;
  variantsLoading: boolean;
  action?: ReactNode;
  appearance?: 'active' | 'alternate';
  hasScheduledChange?: boolean;
  onCancelScheduledChange?: () => void;
  t: (key: string) => string;
}) {
  const sortedComponents = [...components].sort((a, b) => a.orderIndex - b.orderIndex);
  const isActive = appearance !== 'alternate';
  const bg = isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';
  const hoverBg = isActive ? 'hover:bg-green-100/50' : 'hover:bg-gray-100/50';

  return (
    <div className={`${bg} rounded-lg border overflow-hidden`}>
      <div
        className={`p-4 flex items-center gap-3 rounded-lg ${hoverBg} transition-colors`}
      >
        <button
          type="button"
          onClick={onToggle}
          className={`flex-1 min-w-0 text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset rounded-lg`}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-lg text-gray-900">{packName}</span>
            <span className="text-sm font-medium text-gray-700">{packPrice.toFixed(2)} TND</span>
          </div>
          <span className="text-gray-500 flex-shrink-0" aria-hidden>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </button>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {nextPackName && effectiveDate && (
        <div className="px-4 pb-2 flex flex-col gap-2">
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 font-medium">
            {t('services.packChangeScheduled')}: {nextPackName} {t('services.effectiveFrom')}{' '}
            {effectiveDate}
          </div>
          {isActive && hasScheduledChange && onCancelScheduledChange && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancelScheduledChange();
              }}
              className="self-start px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('services.cancelScheduledChange')}
            </button>
          )}
        </div>
      )}

      {isExpanded && (
        <div className={`px-4 pb-4 pt-0 border-t ${isActive ? 'border-green-200' : 'border-gray-200'}`}>
          {sortedComponents.length === 0 ? (
            <p className="text-sm text-gray-500 pt-3">{t('services.noComponentsAvailable')}</p>
          ) : (
            <>
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 pt-3">
                {t('services.packIncludes')}
              </h5>
              <ul className="space-y-3">
                {sortedComponents.map((component) => {
                  const variants = variantsByComponentId.get(component.componentId) ?? [];
                  const activeVariants = variants.filter((v) => v.isActive);
                  return (
                    <li key={component.id} className="text-sm">
                      <div className="flex items-center gap-2 py-1">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            component.required ? 'bg-green-600' : 'bg-gray-400'
                          }`}
                        />
                        <span className="font-medium text-gray-900">{component.componentName}</span>
                        {component.required && (
                          <span className="text-xs text-gray-500">({t('services.required')})</span>
                        )}
                      </div>
                      {variantsLoading ? (
                        <p className="text-xs text-gray-500 pl-4 mt-0.5">
                          {t('services.loading')}
                        </p>
                      ) : activeVariants.length > 0 ? (
                        <div className="pl-4 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          <span className="text-xs text-gray-600">
                            {t('services.variants')}:
                          </span>
                          {activeVariants.map((v) => (
                            <span
                              key={v.id}
                              className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
                            >
                              {v.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main page ---

export default function ServicesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    businessServices,
    allServices,
    loading,
    error,
    loadBusinessServices,
    updateService,
    setError,
  } = useBusinessServices();

  // Cached API data for all subscribed services (loaded on mount)
  const [serviceDetails, setServiceDetails] = useState<Map<string, ServiceWithPacksDto>>(new Map());
  const [packDetails, setPackDetails] = useState<Map<string, PackWithComponentsDto>>(new Map());
  const [detailsLoading, setDetailsLoading] = useState(true);

  // Collapsible packs: which pack IDs are expanded
  const [expandedPackIds, setExpandedPackIds] = useState<Set<string>>(new Set());
  // Variants per component (componentId -> VariantDto[]), loaded when a pack is expanded
  const [componentVariants, setComponentVariants] = useState<Map<string, VariantDto[]>>(new Map());
  const [variantsLoadingForPacks, setVariantsLoadingForPacks] = useState<Set<string>>(new Set());

  const togglePack = useCallback((packId: string) => {
    setExpandedPackIds((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  }, []);

  // When a pack is expanded, load variants for its components
  const loadVariantsForPack = useCallback(async (packId: string) => {
    const packDetail = packDetails.get(packId);
    if (!packDetail?.components?.length) return;
    setVariantsLoadingForPacks((prev) => new Set(prev).add(packId));
    try {
      const results = await Promise.all(
        packDetail.components.map((c) => apiClient.getComponentVariants(c.componentId))
      );
      setComponentVariants((prev) => {
        const next = new Map(prev);
        packDetail.components.forEach((c, i) => next.set(c.componentId, results[i] ?? []));
        return next;
      });
    } catch (e) {
      console.error('Failed to load variants for pack:', e);
    } finally {
      setVariantsLoadingForPacks((prev) => {
        const next = new Set(prev);
        next.delete(packId);
        return next;
      });
    }
  }, [packDetails]);

  // Load variants when a pack is expanded (skip if we already have variants for its components)
  useEffect(() => {
    expandedPackIds.forEach((packId) => {
      const packDetail = packDetails.get(packId);
      if (!packDetail?.components?.length) return;
      const hasAll = packDetail.components.every((c) =>
        componentVariants.has(c.componentId)
      );
      if (!hasAll) loadVariantsForPack(packId);
    });
  }, [expandedPackIds, packDetails, componentVariants, loadVariantsForPack]);

  useEffect(() => {
    if (user?.businessId) loadBusinessServices();
  }, [user?.businessId, loadBusinessServices]);

  // Load details for all subscribed services when business services are available
  const serviceIdsKey = businessServices
    .map((bs) => bs.serviceId)
    .sort()
    .join(',');

  useEffect(() => {
    if (!serviceIdsKey) {
      setDetailsLoading(false);
      return;
    }
    let cancelled = false;
    setDetailsLoading(true);
    (async () => {
      try {
        for (const bs of businessServices) {
          if (cancelled) return;
          const details = await apiClient.getServiceById(bs.serviceId);
          if (cancelled) return;
          setServiceDetails((prev) => new Map(prev).set(bs.serviceId, details));
          for (const p of details.packs) {
            if (cancelled) return;
            const packDetail = await apiClient.getPackById(p.packId);
            if (cancelled) return;
            setPackDetails((prev) => new Map(prev).set(p.packId, packDetail));
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || t('services.failedToLoadServiceDetails'));
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- serviceIdsKey encodes businessServices identity; we intentionally don't depend on serviceDetails/packDetails
  }, [serviceIdsKey, setError, t]);

  // Pack change confirmation: show dialog before applying
  const [pendingPackChange, setPendingPackChange] = useState<{
    serviceId: string;
    packId: string;
    packName: string;
  } | null>(null);
  const [switchingPack, setSwitchingPack] = useState(false);

  // Cancel scheduled pack change: show dialog before cancelling
  const [pendingCancelPackChange, setPendingCancelPackChange] = useState<{
    serviceId: string;
    packId: string;
    packName: string;
  } | null>(null);
  const [cancellingPackChange, setCancellingPackChange] = useState(false);

  const handleSwitchPack = useCallback(
    async (serviceId: string, packId: string) => {
      try {
        setError('');
        setSwitchingPack(true);
        await updateService(serviceId, { packIds: [packId] });
        setServiceDetails(new Map());
        setPendingPackChange(null);
        await loadBusinessServices();
      } catch {
        // setError from hook
      } finally {
        setSwitchingPack(false);
      }
    },
    [updateService, loadBusinessServices, setError]
  );

  const openChangePackDialog = useCallback(
    (serviceId: string, packId: string, packName: string) => {
      setPendingPackChange({ serviceId, packId, packName });
    },
    []
  );

  const confirmChangePack = useCallback(() => {
    if (!pendingPackChange) return;
    handleSwitchPack(pendingPackChange.serviceId, pendingPackChange.packId);
  }, [pendingPackChange, handleSwitchPack]);

  const openCancelPackChangeDialog = useCallback(
    (serviceId: string, packId: string, packName: string) => {
      setPendingCancelPackChange({ serviceId, packId, packName });
    },
    []
  );

  const confirmCancelPackChange = useCallback(async () => {
    if (!pendingCancelPackChange) return;
    try {
      setError('');
      setCancellingPackChange(true);
      await updateService(pendingCancelPackChange.serviceId, {
        packIds: [pendingCancelPackChange.packId],
      });
      setServiceDetails(new Map());
      setPendingCancelPackChange(null);
      await loadBusinessServices();
    } catch {
      // setError from hook
    } finally {
      setCancellingPackChange(false);
    }
  }, [pendingCancelPackChange, updateService, loadBusinessServices, setError]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('services.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('services.subtitleReadonly')}</p>
      </div>

      {error && <Error message={error} onRetry={() => setError('')} />}

      {/* Pack change confirmation dialog */}
      <Dialog open={!!pendingPackChange} onOpenChange={(open) => !open && setPendingPackChange(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('services.changePackConfirmTitle')}</DialogTitle>
            <DialogDescription className="pt-1">
              {t('services.changePackConditions')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setPendingPackChange(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {t('services.cancel')}
            </button>
            <button
              type="button"
              onClick={confirmChangePack}
              disabled={switchingPack || !pendingPackChange}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {switchingPack ? t('services.loading') : t('services.confirmChangePack')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel scheduled pack change confirmation */}
      <Dialog
        open={!!pendingCancelPackChange}
        onOpenChange={(open) => !open && setPendingCancelPackChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('services.cancelScheduledChangeTitle')}</DialogTitle>
            <DialogDescription className="pt-1">
              {t('services.cancelScheduledChangeDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setPendingCancelPackChange(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {t('services.cancel')}
            </button>
            <button
              type="button"
              onClick={confirmCancelPackChange}
              disabled={cancellingPackChange || !pendingCancelPackChange}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {cancellingPackChange ? t('services.loading') : t('services.confirmCancelChange')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {businessServices.length === 0 ? (
        <Empty message={t('services.noServicesActivated')} />
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-900">{t('services.activatedServices')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {businessServices.map((businessService) => {
              const service = allServices.find((s) => s.id === businessService.serviceId);
              if (!service) return null;

              const details = serviceDetails.get(service.id);

              return (
                <Card key={businessService.id}>
                  <ServiceCardHeader
                    service={service}
                    businessService={businessService}
                  />

                  <CardContent className="pt-0">
                    {detailsLoading ? (
                      <div className="py-8 flex justify-center">
                        <Loading />
                      </div>
                    ) : !details ? (
                      <p className="text-center text-gray-500 py-4 text-sm">
                        {t('services.failedToLoadServiceDetails')}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Activated packs */}
                        <section>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {t('services.activatedPacks')}
                          </h4>
                          {businessService.packs.filter((p) => p.isActive).length === 0 ? (
                            <p className="text-sm text-gray-500">{t('services.noPacksActivated')}</p>
                          ) : (
                            <div className="space-y-4">
                              {businessService.packs
                                .filter((p) => p.isActive)
                                .map((pack) => {
                                  const packDetail = packDetails.get(pack.packId);
                                  return (
                                    <div key={pack.id}>
                                      {packDetail ? (
                                        <PackBlock
                                          packId={pack.packId}
                                          packName={pack.packName}
                                          packPrice={pack.packPrice}
                                          nextPackName={pack.nextPackName}
                                          effectiveDate={pack.effectiveDate}
                                          components={packDetail.components}
                                          isExpanded={expandedPackIds.has(pack.packId)}
                                          onToggle={() => togglePack(pack.packId)}
                                          variantsByComponentId={componentVariants}
                                          variantsLoading={variantsLoadingForPacks.has(pack.packId)}
                                          hasScheduledChange={
                                            !!(pack.nextPackName && pack.effectiveDate)
                                          }
                                          onCancelScheduledChange={() =>
                                            openCancelPackChangeDialog(
                                              service.id,
                                              pack.packId,
                                              pack.packName
                                            )
                                          }
                                          t={t}
                                        />
                                      ) : (
                                        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                                          <p className="text-sm text-gray-500">
                                            {pack.packName} — {t('services.noComponentsAvailable')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </section>

                        {/* Change pack (other packs in service) */}
                        {details.packs.filter(
                          (sp) =>
                            !businessService.packs
                              .filter((p) => p.isActive)
                              .some((bp) => bp.packId === sp.packId)
                        ).length > 0 && (
                          <section>
                            <h4 className="font-semibold text-gray-900 mb-3">
                              {t('services.changePack')}
                            </h4>
                            <div className="space-y-3">
                              {details.packs
                                .filter(
                                  (sp) =>
                                    !businessService.packs
                                      .filter((p) => p.isActive)
                                      .some((bp) => bp.packId === sp.packId)
                                )
                                .map((servicePack) => {
                                  const packDetail = packDetails.get(servicePack.packId);
                                  return (
                                    <div key={servicePack.id}>
                                      {packDetail && packDetail.components.length > 0 ? (
                                        <PackBlock
                                          packId={servicePack.packId}
                                          packName={servicePack.packName}
                                          packPrice={servicePack.packPrice}
                                          components={packDetail.components}
                                          isExpanded={expandedPackIds.has(servicePack.packId)}
                                          onToggle={() => togglePack(servicePack.packId)}
                                          variantsByComponentId={componentVariants}
                                          variantsLoading={variantsLoadingForPacks.has(servicePack.packId)}
                                          action={
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openChangePackDialog(
                                                  service.id,
                                                  servicePack.packId,
                                                  servicePack.packName
                                                );
                                              }}
                                              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                            >
                                              {t('services.switchToThisPack')}
                                            </button>
                                          }
                                          appearance="alternate"
                                          t={t}
                                        />
                                      ) : (
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                          <p className="text-sm text-gray-500">
                                            {t('services.noComponentsAvailable')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </section>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
