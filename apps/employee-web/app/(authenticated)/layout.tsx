'use client';

import { ClientSidebarLayout } from '../../components/layouts/ClientSidebarLayout';
import { ProtectedRoute } from '../../components/protected-route';
import { UserRole } from '@contracts/core';
import { DegradedModeBanner } from '../../components/degraded-mode-banner';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <ClientSidebarLayout>
        <DegradedModeBanner />
        {children}
      </ClientSidebarLayout>
    </ProtectedRoute>
  );
}
