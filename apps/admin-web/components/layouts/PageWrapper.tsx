'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from './AdminLayout';
import { ProtectedRoute } from '../protected-route';
import { UserRole } from '@contracts/core';

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // Don't wrap login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Wrap all other pages with AdminLayout (including main page)
  return (
    <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
