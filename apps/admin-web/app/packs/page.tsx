'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePacks } from '../../hooks/usePacks';
import { useFoodComponents } from '../../hooks/useFoodComponents';
import { PackDto, ServiceWithPacksDto } from '@contracts/core';
import { Error } from '../../components/ui/error';
import { Loading } from '../../components/ui/loading';
import { Empty } from '../../components/ui/empty';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { StatisticsBadge } from '../../components/statistics/StatisticsBadge';
import { PackModal } from '../../components/packs/PackModal';
import { apiClient } from '../../lib/api-client';
import { Package } from 'lucide-react';

export default function PacksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const packIdFromUrl = searchParams.get('packId');

  const { packs, loading, error, loadPacks, setError } = usePacks();
  const { loadComponents } = useFoodComponents();
  const [servicesWithPacks, setServicesWithPacks] = useState<
    ServiceWithPacksDto[]
  >([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [modalPackId, setModalPackId] = useState<string | null | 'create'>(
    null,
  );

  useEffect(() => {
    loadPacks();
    loadComponents();
  }, [loadPacks, loadComponents]);

  useEffect(() => {
    if (packIdFromUrl) {
      setModalPackId(packIdFromUrl);
    }
  }, [packIdFromUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingServices(true);
      try {
        const services = await apiClient.getServices();
        const withPacks = await Promise.all(
          services.map((s) => apiClient.getServiceById(s.id)),
        );
        if (!cancelled) setServicesWithPacks(withPacks);
      } catch {
        if (!cancelled) setServicesWithPacks([]);
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { groups, ungroupedPacks } = useMemo(() => {
    const packById = new Map(packs.map((p) => [p.id, p]));
    const packIdsInAnyService = new Set<string>();
    const groups: {
      serviceId: string;
      serviceName: string;
      packs: PackDto[];
    }[] = [];

    for (const svc of servicesWithPacks) {
      const fullPacks: PackDto[] = [];
      for (const sp of svc.packs) {
        packIdsInAnyService.add(sp.packId);
        const pack = packById.get(sp.packId);
        if (pack) fullPacks.push(pack);
      }
      if (fullPacks.length > 0) {
        groups.push({
          serviceId: svc.id,
          serviceName: svc.name,
          packs: fullPacks,
        });
      }
    }

    const ungroupedPacks = packs.filter(
      (p) => !packIdsInAnyService.has(p.id),
    );
    return { groups, ungroupedPacks };
  }, [packs, servicesWithPacks]);

  const openViewEdit = (pack: PackDto) => {
    setModalPackId(pack.id);
  };

  const openCreate = () => {
    setModalPackId('create');
  };

  const closeModal = () => {
    setModalPackId(null);
    if (packIdFromUrl) {
      router.replace('/packs');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Packs"
        description="Meal packs offered to employees. Each pack includes one or more food components (e.g. soup, main, salad) with optional variants."
        action={<Button onClick={openCreate}>+ New Pack</Button>}
      />

      {error && (
        <div className="mb-4">
          <Error message={error} onRetry={() => setError('')} />
        </div>
      )}

      {loading || loadingServices ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Loading message="Loading packs..." />
        </div>
      ) : packs.length === 0 ? (
        <div className="bg-surface border border-surface-dark rounded-lg p-12">
          <Empty
            message="No packs found"
            description="Create your first pack to get started."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ serviceId, serviceName, packs: servicePacks }) => (
            <div
              key={serviceId}
              className="bg-surface border border-surface-dark rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4 bg-surface-light border-b border-surface-dark flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {serviceName}
                </h2>
                <span className="text-sm text-gray-500">
                  ({servicePacks.length} pack
                  {servicePacks.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-light/70 border-b border-surface-dark text-sm font-semibold text-gray-700">
                  <div className="col-span-4">Pack name</div>
                  <div className="col-span-2">Price (TND)</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-4" />
                </div>
                {servicePacks.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => openViewEdit(pack)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-surface-dark last:border-b-0 cursor-pointer hover:bg-surface-light transition-colors"
                  >
                    <div className="col-span-4">
                      <span className="font-medium text-gray-900">
                        {pack.name}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <StatisticsBadge
                        label=""
                        value={`${pack.price.toFixed(2)} TND`}
                        variant="primary"
                        size="sm"
                      />
                    </div>
                    <div className="col-span-2">
                      {!pack.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-surface-light text-gray-800 rounded-full">
                          Inactive
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-success-50 text-success-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="col-span-4" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {ungroupedPacks.length > 0 && (
            <div className="bg-surface border border-surface-dark rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-surface-light border-b border-surface-dark flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-700">
                  Not in any service
                </h2>
                <span className="text-sm text-gray-500">
                  ({ungroupedPacks.length} pack
                  {ungroupedPacks.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-light/70 border-b border-surface-dark text-sm font-semibold text-gray-700">
                  <div className="col-span-4">Pack name</div>
                  <div className="col-span-2">Price (TND)</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-4" />
                </div>
                {ungroupedPacks.map((pack) => (
                  <div
                    key={pack.id}
                    onClick={() => openViewEdit(pack)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-surface-dark last:border-b-0 cursor-pointer hover:bg-surface-light transition-colors"
                  >
                    <div className="col-span-4">
                      <span className="font-medium text-gray-900">
                        {pack.name}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <StatisticsBadge
                        label=""
                        value={`${pack.price.toFixed(2)} TND`}
                        variant="primary"
                        size="sm"
                      />
                    </div>
                    <div className="col-span-2">
                      {!pack.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium bg-surface-light text-gray-800 rounded-full">
                          Inactive
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-success-50 text-success-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="col-span-4" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <PackModal
        open={modalPackId !== null}
        onClose={closeModal}
        packId={modalPackId === 'create' ? null : modalPackId}
        onSaved={loadPacks}
      />
    </div>
  );
}
