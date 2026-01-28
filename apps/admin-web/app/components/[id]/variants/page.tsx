'use client';

// Redirect to variants page with componentId filter
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ComponentVariantsRedirect() {
  const params = useParams();
  const router = useRouter();
  const componentId = params.id as string;

  useEffect(() => {
    if (componentId) {
      router.replace(`/variants?componentId=${componentId}`);
    } else {
      router.replace('/variants');
    }
  }, [componentId, router]);

  return null;
}
