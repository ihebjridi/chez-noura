'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { Loading } from '../components/ui/loading';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/calendar');
      } else {
        router.push('/login');
      }
    }
  }, [loading, isAuthenticated, router]);

  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading message={t('common.messages.loading')} />
    </div>
  );
}
