'use client';

import { useEffect } from 'react';
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

  return (
    <div className="flex-1 flex items-center justify-center">
      <Loading message="Redirecting..." />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loading message="Loading..." />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
