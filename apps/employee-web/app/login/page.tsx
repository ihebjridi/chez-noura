'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/auth-context';
import { Logo } from '../../components/logo';
import { LanguageSwitcher } from '../../components/language-switcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated (only after auth check is complete)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/calendar');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email);
    } catch (err: any) {
      setError(err.message || t('common.messages.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md bg-surface border border-surface-dark rounded-lg shadow-sm p-6 md:p-8">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">EMPLOYEE PORTAL</h1>
          <Logo className="justify-center mb-2" />
          <p className="text-xs md:text-sm text-gray-600 mt-2">{t('auth.subtitle')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.labels.emailAddress')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('auth.emailPlaceholder')}
              className="w-full px-3 py-2.5 border border-surface-dark rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-background"
            />
          </div>

          {error && (
            <div className="bg-warning-50 border border-warning-300 rounded-md p-3">
              <p className="text-sm text-warning-800 font-normal">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('auth.loggingIn') : t('auth.continue')}
          </button>
        </form>

        <p className="mt-6 text-xs md:text-sm text-gray-500 text-center">
          {t('auth.description')}
        </p>
      </div>
    </div>
  );
}
