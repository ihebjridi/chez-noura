'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FoodComponentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/components');
  }, [router]);

  return null;
}
