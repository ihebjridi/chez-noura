'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/protected-route';
import { UserRole } from '@contracts/core';
import { Loading } from '../../components/ui/loading';

export default function DailyMenusPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main dashboard page
    router.replace('/');
  }, [router]);

  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Redirecting..." />
      </div>
    </ProtectedRoute>
  );
}
