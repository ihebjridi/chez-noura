'use client';

import { useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading } from '../../../components/ui/loading';

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to calendar page (which now shows order history)
    const successParam = searchParams.get('success');
    const redirectUrl = successParam === 'true' 
      ? '/calendar?success=true'
      : '/calendar';
    router.replace(redirectUrl);
  }, [router, searchParams]);

  const { t } = useTranslation();
  
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loading message={t('common.buttons.redirecting')} />
    </div>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading message={t('common.messages.loading')} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrdersContent />
    </Suspense>
  );
}
