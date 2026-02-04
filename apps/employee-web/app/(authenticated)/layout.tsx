'use client';

/** Renders sidebar/bottom nav and wraps content with transition and toast provider. */
import { ClientSidebarLayout } from '../../components/layouts/ClientSidebarLayout';
import { ProtectedRoute } from '../../components/protected-route';
import { UserRole } from '@contracts/core';
import { DegradedModeBanner } from '../../components/degraded-mode-banner';
import { ToastProvider } from '../../components/notifications';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={UserRole.EMPLOYEE}>
      <ToastProvider>
        <ClientSidebarLayout>
          <DegradedModeBanner />
          {children}
        </ClientSidebarLayout>
      </ToastProvider>
    </ProtectedRoute>
  );
}
