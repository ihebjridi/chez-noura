'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PackComponentsPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.id as string;

  useEffect(() => {
    if (packId) {
      router.replace(`/packs?packId=${encodeURIComponent(packId)}`);
    }
  }, [packId, router]);

  return null;
}
