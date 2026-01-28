'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { UserRole } from '@contracts/core';
import { Loading } from './ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && requiredRole && user?.role !== requiredRole) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loading message={t('common.messages.loading')} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
