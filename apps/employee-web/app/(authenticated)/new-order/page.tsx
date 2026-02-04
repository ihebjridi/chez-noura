'use client';

/**
 * Orchestrates new order flow; state lives here, UI in components/new-order/.
 */

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import {
  AvailablePackDto,
  OrderDto,
  EmployeeMenuDto,
} from '@contracts/core';
import { Loading } from '../../../components/ui/loading';
import { Empty } from '../../../components/ui/empty';
import { Error } from '../../../components/ui/error';
import { useToast } from '../../../components/notifications';
import {
  NewOrderDateHeader,
  ExistingOrdersNotice,
  ServicePackList,
  PackSummary,
  ComponentVariantPicker,
  PlaceOrderBar,
  type ReadyTimeInfo,
} from '../../../components/new-order';
import { getTodayISO, getTomorrowISO } from '../../../lib/date-utils';
import { getLatestServiceCutoff } from '../../../lib/service-window-utils';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message;
    return typeof m === 'string' ? m : String(err);
  }
  return String(err);
}

function NewOrderContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [menu, setMenu] = useState<EmployeeMenuDto | null>(null);
  const [packs, setPacks] = useState<AvailablePackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPack, setSelectedPack] = useState<AvailablePackDto | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [existingOrders, setExistingOrders] = useState<OrderDto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedDate = searchParams.get('date') || getTodayISO();
  const today = getTodayISO();

  useEffect(() => {
    if (selectedDate < today) {
      router.replace(`/new-order?date=${today}`);
      setError(t('menu.pastDateMenu'));
      return;
    }
    const loadData = async () => {
      if (selectedDate === today) {
        const orders = await checkExistingOrders();
        await loadMenu(orders);
      } else {
        await loadMenu();
      }
    };
    loadData();
  }, [selectedDate]);

  const loadMenu = async (ordersToUse?: OrderDto[]) => {
    try {
      setLoading(true);
      setError('');
      setSelectedPack(null);
      setSelections({});
      if (selectedDate < today) {
        setError(t('menu.pastDateMenu'));
        router.replace(`/new-order?date=${today}`);
        return;
      }
      const menuData = await apiClient.getEmployeeMenu(selectedDate);
      const orders = ordersToUse ?? existingOrders;
      const orderedServiceIds = new Set(
        orders.map((order) => order.serviceId).filter((id): id is string => !!id)
      );
      const availablePacks = menuData.packs.filter((pack) => {
        if (!pack.serviceId) return orders.length === 0;
        return !orderedServiceIds.has(pack.serviceId);
      });
      setMenu(menuData);
      setPacks(availablePacks);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (message.includes('not found') || message.includes('404')) {
        setError(t('common.messages.menuNotAvailableDate'));
      } else if (message.includes('past date') || message.includes('read-only')) {
        setError(t('menu.pastDateMenu'));
        router.replace(`/new-order?date=${today}`);
      } else {
        setError(message || t('menu.failedToLoadMenu'));
      }
      setMenu(null);
      setPacks([]);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingOrders = async () => {
    try {
      const orders = await apiClient.getTodayOrders();
      setExistingOrders(orders);
      return orders;
    } catch {
      setExistingOrders([]);
      return [];
    }
  };

  const handlePackSelect = (pack: AvailablePackDto) => {
    setSelectedPack(pack);
    setSelections({});
    setError('');
  };

  const handleChangePack = () => {
    setSelectedPack(null);
    setSelections({});
  };

  const handleVariantSelect = (componentId: string, variantId: string) => {
    setSelections((prev) => ({ ...prev, [componentId]: variantId }));
    setError('');
  };

  const sortedComponents = selectedPack
    ? [...selectedPack.components].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const isOrderValid =
    !!selectedPack &&
    sortedComponents.every((c) => !c.required || selections[c.id]);

  const readyTime: ReadyTimeInfo | null = menu
    ? (() => {
        const cutoffDate = menu.serviceWindows?.length
          ? getLatestServiceCutoff(menu)
          : menu.cutoffTime
            ? new Date(menu.cutoffTime)
            : null;
        if (!cutoffDate) return null;
        const readyDate = new Date(cutoffDate.getTime() + 2 * 60 * 60 * 1000);
        const now = new Date();
        const isToday = readyDate.toDateString() === now.toDateString();
        const locale = i18n.language || 'fr';
        const timeStr = readyDate.toLocaleTimeString(locale, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return { date: readyDate, isToday, timeStr };
      })()
    : null;

  const handlePlaceOrder = async () => {
    if (selectedPack?.serviceId) {
      const hasOrderForService = existingOrders.some(
        (order) => order.serviceId === selectedPack.serviceId
      );
      if (hasOrderForService) {
        const serviceName = selectedPack.serviceName || 'this service';
        setError(
          `You have already placed an order for ${serviceName} on this date. Only one order per service per day is allowed.`
        );
        return;
      }
    } else if (existingOrders.length > 0) {
      setError(t('common.messages.alreadyOrderedDate'));
      return;
    }
    if (!selectedPack || !isOrderValid || !menu) {
      setError(t('common.messages.selectPackAndComponents'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const selectedVariants = Object.entries(selections).map(([componentId, variantId]) => ({
        componentId,
        variantId,
      }));
      const order = await apiClient.createEmployeeOrder({
        dailyMenuId: menu.id,
        packId: selectedPack.id,
        selectedVariants,
      });
      const updatedOrders = [...existingOrders, order];
      setExistingOrders(updatedOrders);
      await loadMenu(updatedOrders);
      showToast({ type: 'success', message: t('common.messages.orderPlacedSuccess') });
      router.push('/today');
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || t('common.messages.failedToPlaceOrder');
      if (
        errorMessage.includes('cutoff') ||
        errorMessage.includes('cut-off') ||
        errorMessage.includes('Ordering cutoff') ||
        errorMessage.includes('cutoff time')
      ) {
        setError(t('common.messages.cutoffTimePassed'));
      } else if (
        errorMessage.includes('starts at') ||
        errorMessage.includes('order start')
      ) {
        setError(errorMessage);
      } else if (
        errorMessage.includes('already ordered') ||
        errorMessage.includes('duplicate') ||
        errorMessage.includes('Conflict')
      ) {
        setError(t('common.messages.alreadyOrderedDate'));
        if (selectedDate === today) checkExistingOrders();
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    let locale = 'fr';
    if (typeof document !== 'undefined') {
      try {
        const cookies = document.cookie.split(';');
        const localeCookie = cookies.find((c) => c.trim().startsWith('NEXT_LOCALE='));
        if (localeCookie) {
          const loc = localeCookie.split('=')[1].trim();
          if (loc === 'fr' || loc === 'en') locale = loc;
        }
      } catch {
        // fallback
      }
    }
    if (dateStr === today) return t('common.labels.today');
    if (dateStr === getTomorrowISO()) return t('common.labels.tomorrow');
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loading message={t('common.messages.loading')} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-20 lg:pb-4">
      <NewOrderDateHeader
        selectedDate={selectedDate}
        formattedDate={formatDate(selectedDate)}
      />
      <ExistingOrdersNotice existingOrders={existingOrders} />

      {error && (
        <div className="mb-4">
          <Error message={error} />
        </div>
      )}

      {!menu && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-surface border border-surface-dark rounded-lg p-8 w-full max-w-md">
            <Empty
              message={t('menu.menuUnavailable')}
              description={t('common.messages.menuNotAvailableDate')}
            />
          </div>
        </div>
      )}

      {menu && packs.length > 0 && (
        <div className="space-y-4">
          {!selectedPack ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900 px-1">
                {t('menu.selectPack')}
              </h2>
              <ServicePackList menu={menu} packs={packs} onSelectPack={handlePackSelect} />
            </div>
          ) : (
            <>
              <PackSummary pack={selectedPack} onChangePack={handleChangePack} sticky />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 px-1">
                  {t('menu.selectVariant')}
                </h2>
                {sortedComponents.map((component, index) => (
                  <div key={component.id} className={index > 0 ? 'pt-2' : ''}>
                    <ComponentVariantPicker
                      component={component}
                      selectedVariantId={selections[component.id]}
                      onSelectVariant={handleVariantSelect}
                    />
                  </div>
                ))}
              </div>
              <PlaceOrderBar
                readyTime={readyTime}
                locale={i18n.language || 'fr'}
                isValid={isOrderValid}
                submitting={submitting}
                onPlaceOrder={handlePlaceOrder}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loading message={t('common.messages.loading')} />
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewOrderContent />
    </Suspense>
  );
}
