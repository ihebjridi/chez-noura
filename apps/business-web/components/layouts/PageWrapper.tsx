'use client';

import { usePathname } from 'next/navigation';
import { BusinessLayout } from './BusinessLayout';
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

  // Wrap all other pages with BusinessLayout
  return (
    <ProtectedRoute requiredRole={UserRole.BUSINESS_ADMIN}>
      <BusinessLayout>{children}</BusinessLayout>
    </ProtectedRoute>
  );
}
