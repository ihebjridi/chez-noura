'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/auth-context';
import { LanguageSwitcher } from '../language-switcher';
import { ShoppingCart, History, LogOut } from 'lucide-react';

interface EmployeeLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backAction?: () => void;
}

export function EmployeeLayout({
  children,
  showBackButton = false,
  backAction,
}: EmployeeLayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isMenuPage = pathname === '/menu';
  const isOrdersPage = pathname === '/orders' || pathname === '/calendar';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header - Only essential info */}
      <header className="sticky top-0 z-30 bg-surface border-b border-surface-dark">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back button or title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {showBackButton && backAction && (
                <button
                  onClick={backAction}
                  className="p-2 hover:bg-surface-light rounded-md transition-colors -ml-2"
                  aria-label={t('common.buttons.back')}
                >
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              {isMenuPage && (
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {t('menu.orderIftar')}
                  </h1>
                  {user && (
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  )}
                </div>
              )}
              {isOrdersPage && (
                <h1 className="text-lg font-semibold text-gray-900">{t('orders.myOrders')}</h1>
              )}
            </div>

            {/* Right: Context actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageSwitcher />
              {isMenuPage && (
                <button
                  onClick={() => router.push('/calendar')}
                  className="p-2 hover:bg-surface-light rounded-md transition-colors relative"
                  aria-label={t('layout.viewOrders')}
                >
                  <History className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {(isOrdersPage || pathname === '/calendar') && (
                <button
                  onClick={() => router.push('/menu')}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-semibold min-h-[44px] flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.buttons.newOrder')}</span>
                </button>
              )}
              <button
                onClick={logout}
                className="p-2 hover:bg-surface-light rounded-md transition-colors"
                aria-label={t('layout.logout')}
              >
                <LogOut className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {children}
      </main>
    </div>
  );
}
