'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, History, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navigation = [
    { name: t('today.title'), href: '/today', icon: Calendar },
    { name: t('newOrder.title'), href: '/new-order', icon: Plus },
    { name: t('orders.orderHistory'), href: '/calendar', icon: History },
    { name: t('company.title'), href: '/company', icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === '/today') {
      return pathname === '/today' || pathname === '/';
    }
    return pathname === href || (href !== '/' && pathname?.startsWith(href.split('?')[0]));
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-surface-dark lg:hidden safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="grid grid-cols-4 h-16 min-h-[64px]">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-0 touch-manipulation overflow-hidden px-1',
                active ? 'text-primary-600' : 'text-gray-500'
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-10 h-8 flex-shrink-0 rounded-xl transition-all duration-200',
                  active && 'bg-primary-100 scale-105'
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-all duration-200 flex-shrink-0',
                    active && 'text-primary-600'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight truncate max-w-full text-center transition-all duration-200',
                  active ? 'text-primary-600' : 'text-gray-500'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
