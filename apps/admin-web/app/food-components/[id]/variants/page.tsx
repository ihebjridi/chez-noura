'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FoodComponentVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const componentId = params.id as string;

  useEffect(() => {
    if (componentId) {
      router.replace(
        `/food-components?componentId=${encodeURIComponent(componentId)}`,
      );
    }
  }, [componentId, router]);

  return null;
}
